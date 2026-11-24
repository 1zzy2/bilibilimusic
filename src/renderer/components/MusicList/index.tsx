import {
    ColumnDef,
    createColumnHelper,
    flexRender,
    getCoreRowModel,

    getExpandedRowModel,
    ExpandedState,
    CellContext,

    useReactTable,
} from "@tanstack/react-table";

import "./index.scss";

import { secondsToDuration } from "@/common/time-util";
import MusicSheet from "@/renderer/core/music-sheet";
import trackPlayer from "@renderer/core/track-player";
import Condition, { IfTruthy } from "../Condition";
import Empty from "../Empty";
import MusicFavorite from "../MusicFavorite";
import { localPluginName, RequestStateCode } from "@/common/constant";
import BottomLoadingState from "../BottomLoadingState";
import { IContextMenuItem, showContextMenu } from "../ContextMenu";
import { getInternalData, getMediaPrimaryKey, isSameMedia } from "@/common/media-util";
import { CSSProperties, memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showModal } from "../Modal";
import useVirtualList from "@/hooks/useVirtualList";
import hotkeys from "hotkeys-js";
import Downloader from "@/renderer/core/downloader";
import { toast } from "react-toastify";

import musicSheetDB from "@/renderer/core/db/music-sheet-db";
import DragReceiver, { startDrag } from "../DragReceiver";
import { i18n } from "@/shared/i18n/renderer";
import isLocalMusic from "@/renderer/utils/is-local-music";
import AppConfig from "@shared/app-config/renderer";
import { shellUtil } from "@shared/utils/renderer";
import getBilibiliCollection, { getBilibiliCollectionKey } from "@renderer/utils/bilibili-collection";

interface IMusicListProps {
    /** 展示的播放列表 */
    musicList: IMusic.IMusicItem[];
    /** 实际的播放列表 */
    getAllMusicItems?: () => IMusic.IMusicItem[];
    /** 音乐列表所属的歌单信息 */
    musicSheet?: IMusic.IMusicSheetItem;
    // enablePagination?: boolean; // 分页/虚拟长列表
    state?: RequestStateCode; // 网络状态
    doubleClickBehavior?: "replace" | "normal"; // 双击行为
    onPageChange?: (page?: number) => void; // 分页
    /** 虚拟滚动参数 */
    virtualProps?: {
        offsetHeight?: number | (() => number); // 距离顶部的高度
        getScrollElement?: () => HTMLElement; // 滚动
        fallbackRenderCount?: number;
    };
    containerStyle?: CSSProperties;
    hideRows?: Array<
        "like" | "index" | "title" | "artist" | "album" | "duration" | "platform"
    >;
    /** 允许拖拽 */
    enableDrag?: boolean;
    /** 拖拽结束 */
    onDragEnd?: (newMusicList: IMusic.IMusicItem[]) => void;
    /** context */
    contextMenu?: IContextMenuItem[];
    /** 行内操作区右侧附加内容（如搜索栏） */
    headerExtra?: ReactNode;
}

const columnHelper = createColumnHelper<IMusic.IMusicItem>();
const columnDef: ColumnDef<IMusic.IMusicItem>[] = [
    columnHelper.display({
        id: "like",
        size: 36,
        minSize: 36,
        maxSize: 36,
        cell: (info) => (
            <div className="music-list-operations">
                <MusicFavorite musicItem={info.row.original} size={18}></MusicFavorite>

            </div>
        ),
        enableResizing: false,
        enableSorting: false,
    }),
    columnHelper.display({ id: "index", size: 44, header: "选择" }),
    columnHelper.accessor("title", {
        header: () => i18n.t("media.media_title"),
        size: 250,
        maxSize: 300,
        minSize: 100,
        cell: (info) => {
            const title = info?.getValue?.();
            return <span title={title}>{title}</span>;
        },
    }),

    columnHelper.accessor("artist", {
        header: () => i18n.t("media.media_type_artist"),
        size: 130,
        maxSize: 200,
        minSize: 60,
        cell: (info) => <span title={info.getValue()}>{info.getValue()}</span>,
    }),
    columnHelper.accessor("duration", {
        header: () => i18n.t("media.media_duration"),
        size: 64,
        maxSize: 150,
        minSize: 48,
        cell: (info) =>
            info.getValue() ? secondsToDuration(info.getValue()) : "--:--",
    }),

];

const estimizeItemHeight = 40;
const columnWidths: Record<string, CSSProperties["width"]> = { like: 36, index: 44, artist: "26%", duration: 88 };

export function showMusicContextMenu(
    musicItems: IMusic.IMusicItem | IMusic.IMusicItem[],
    x: number,
    y: number,
    sheetType?: string,
) {
    const menuItems: IContextMenuItem[] = [];
    const isArray = Array.isArray(musicItems);
    if (!isArray) {
        menuItems.push(
            {
                title: `ID: ${getMediaPrimaryKey(musicItems)}`,
                icon: "identification",
            },
            {
                title: `${i18n.t("media.media_type_artist")}: ${
                    musicItems.artist ?? i18n.t("media.unknown_artist")
                }`,
                icon: "user",
            },
            {
                title: `${i18n.t("media.media_type_album")}: ${
                    musicItems.album ?? i18n.t("media.unknown_album")
                }`,
                icon: "album",
                show: !!musicItems.album,
            },
            {
                divider: true,
            },
        );
    }
    menuItems.push(
        {
            title: i18n.t("music_list_context_menu.next_play"),
            icon: "motion-play",
            onClick() {
                trackPlayer.addNext(musicItems);
            },
        },
        {
            title: i18n.t("music_list_context_menu.add_to_my_sheets"),
            icon: "document-plus",
            onClick() {
                showModal("AddMusicToSheet", {
                    musicItems: musicItems,
                });
            },
        },
        {
            title: i18n.t("music_list_context_menu.remove_from_sheet"),
            icon: "trash",
            show: !!sheetType && sheetType !== "play-list",
            onClick() {
                MusicSheet.frontend.removeMusicFromSheet(musicItems, sheetType);
            },
        },
        {
            title: i18n.t("common.remove"),
            icon: "trash",
            show: sheetType === "play-list",
            onClick() {
                trackPlayer.removeMusic(musicItems);
            },
        },
    );

    menuItems.push(
        {
            title: i18n.t("music_list_context_menu.delete_local_download"),
            icon: "trash",
            show:
                (isArray && musicItems.every((it) => Downloader.isDownloaded(it))) ||
                (!isArray && Downloader.isDownloaded(musicItems)),
            async onClick() {
                const [isSuccess, info] = await Downloader.removeDownloadedMusic(
                    musicItems,
                    true,
                );
                if (isSuccess) {
                    if (isArray) {
                        toast.success(
                            i18n.t(
                                "music_list_context_menu.delete_local_downloaded_songs_success",
                                {
                                    musicNums: musicItems.length,
                                },
                            ),
                        );
                    } else {
                        toast.success(
                            i18n.t(
                                "music_list_context_menu.delete_local_downloaded_song_success",
                                {
                                    songName: (musicItems as IMusic.IMusicItem).title,
                                },
                            ),
                        );
                    }
                } else if (info?.msg) {
                    toast.error(info.msg);
                }
            },
        },
        {
            title: i18n.t(
                "music_list_context_menu.reveal_local_music_in_file_explorer",
            ),
            icon: "folder-open",
            show:
                !isArray &&
                (Downloader.isDownloaded(musicItems) ||
                    musicItems?.platform === localPluginName),
            async onClick() {
                try {
                    if (!isArray) {
                        let realTimeMusicItem = musicItems;
                        if (musicItems.platform !== localPluginName) {
                            realTimeMusicItem = await musicSheetDB.musicStore.get([
                                musicItems.platform,
                                musicItems.id,
                            ]);
                        }

                        const downloadPath = getInternalData<IMusic.IMusicItemInternalData>(
                            realTimeMusicItem,
                            "downloadData",
                        )?.path;

                        const result = await shellUtil.showItemInFolder(downloadPath);
                        if (!result) {
                            throw new Error();
                        }
                    }
                } catch (e) {
                    toast.error(
                        `${i18n.t(
                            "music_list_context_menu.reveal_local_music_in_file_explorer_fail",
                        )} ${e?.message ?? ""}`,
                    );
                }
            },
        },
    );

    showContextMenu({
        x,
        y,
        menuItems,
    });
}

function _MusicList(props: IMusicListProps) {
    const {
        musicList,
        state = RequestStateCode.FINISHED,
        onPageChange,
        musicSheet,
        virtualProps,
        // getAllMusicItems,
        doubleClickBehavior,
        containerStyle,
        hideRows,
        enableDrag,
        onDragEnd,
        headerExtra,
    } = props;

    const [batchMode, setBatchMode] = useState(false);
    const [selectedMusic, setSelectedMusic] = useState<Map<string, IMusic.IMusicItem>>(new Map());
    const toggleSelection = useCallback((items: IMusic.IMusicItem[]) => {
        setSelectedMusic((previous) => {
            const next = new Map(previous);
            const remove = items.every((item) => previous.has(getMediaPrimaryKey(item)));
            items.forEach((item) => {
                const key = getMediaPrimaryKey(item);
                if (remove) {
                    next.delete(key);
                } else {
                    next.set(key, item);
                }
            });
            return next;
        });
    }, []);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [collectionParts, setCollectionParts] = useState<Record<string, IMusic.IMusicItem[]>>({});
    useEffect(() => {
        let cancelled = false;
        musicList.filter((item) => item.platform === "bilibili" && !item.cid).forEach((item) => {
            getBilibiliCollection(item).then((parts) => {
                if (!cancelled) {
                    setCollectionParts((previous) => ({
                        ...previous,
                        [getBilibiliCollectionKey(item)]: parts.length > 1 ? parts : [],
                    }));
                }
            }).catch(() => {
                // 未确认分 P 数量时不显示展开按钮，下次加载列表时重试。
            });
        });
        return () => {
            cancelled = true; 
        };
    }, [musicList]);

    const tableData = useMemo(() => [...musicList], [musicList, collectionParts]);
    const columns = useMemo(() => columnDef.map((column, index) => index === 1 && batchMode ? {
        ...column,
        id: "index",
        header: () => "选择",
        cell: (info: CellContext<IMusic.IMusicItem, unknown>) => {
            const items = info.row.subRows.length
                ? info.row.getLeafRows().map((row) => row.original)
                : [info.row.original];
            const selectedCount = items.filter((item) => selectedMusic.has(getMediaPrimaryKey(item))).length;
            return <input
                type="checkbox"
                aria-label={`选择 ${info.row.original.title}`}
                checked={selectedCount === items.length}
                ref={(element) => {
                    if (element) {
                        element.indeterminate = selectedCount > 0 && selectedCount < items.length;
                    }
                }}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onChange={() => toggleSelection(items)}
            />;
        },
    } : index === 2 ? {
        ...column,
        cell: (info: CellContext<IMusic.IMusicItem, unknown>) => {
            const item = info.row.original;
            const key = getBilibiliCollectionKey(item);
            const canExpand = !item.cid && (collectionParts[key]?.length ?? 0) > 1;

            return <div className="music-list-title" style={{ paddingLeft: info.row.depth * 20 }}>
                {canExpand && <button
                    type="button"
                    className="collection-toggle"
                    title={info.row.getIsExpanded() ? "收起合集" : "展开合集"}
                    aria-label={info.row.getIsExpanded() ? "收起合集" : "展开合集"}
                    aria-expanded={info.row.getIsExpanded()}
                    onDoubleClick={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation();
                        info.row.toggleExpanded();
                    }}
                >{info.row.getIsExpanded() ? "▾" : "▸"}</button>}
                <span title={item.title}>{item.title}</span>
            </div>;
        },
    } : column).filter((column) => column.id !== "index" || batchMode), [collectionParts, batchMode, selectedMusic, toggleSelection]);

    const musicListRef = useRef(musicList);
    const columnShownRef = useRef(
        AppConfig.getConfig("normal.musicListColumnsShown").reduce(
            (prev, curr) => ({
                ...prev,
                [curr]: false,
            }),
            {},
        ),
    );

    const table = useReactTable({
        debugAll: false,
        data: tableData,
        columns,
        getSubRows: (item) => collectionParts[getBilibiliCollectionKey(item)],
        getExpandedRowModel: getExpandedRowModel(),
        onExpandedChange: setExpanded,
        autoResetExpanded: false,
        state: {
            expanded,

            columnVisibility: hideRows
                ? hideRows.reduce((prev, curr) => ({ ...prev, [curr]: false }), {
                    ...columnShownRef.current,
                })
                : columnShownRef.current,
        },

        getCoreRowModel: getCoreRowModel(),

    });

    const tableContainerRef = useRef<HTMLDivElement>();
    const virtualController = useVirtualList({
        data: table.getRowModel().rows,
        getScrollElement: virtualProps?.getScrollElement,
        offsetHeight: () => tableContainerRef.current?.offsetTop ?? 0,
        estimateItemHeight: estimizeItemHeight,
        fallbackRenderCount: !(
            virtualProps?.getScrollElement
        )
            ? -1
            : virtualProps?.fallbackRenderCount ?? 50,
    });

    const [activeItems, setActiveItems] = useState<Set<number>>(new Set());
    const lastActiveIndexRef = useRef(0);

    useEffect(() => {
        setExpanded({});
        setSelectedMusic(new Map());
    }, [musicList]);

    useEffect(() => {
        setActiveItems(new Set());
        lastActiveIndexRef.current = 0;
        musicListRef.current = table.getRowModel().rows.map((row) => row.original);
    }, [musicList, expanded, collectionParts]);

    useEffect(() => {
        const ctrlAHandler = (evt: Event) => {
            evt.preventDefault();
            if (batchMode) {
                const items = table.getRowModel().rows.flatMap((row) =>
                    row.subRows.length ? row.getLeafRows().map((child) => child.original) : [row.original],
                );
                setSelectedMusic(new Map(items.map((item) => [getMediaPrimaryKey(item), item])));
                return;
            }
            setActiveItems(new Set(Array.from({ length: musicListRef.current.length }, (_, i) => i)));
        };
        hotkeys("Ctrl+A", "music-list", ctrlAHandler);

        return () => {
            hotkeys.unbind("Ctrl+A", ctrlAHandler);
        };
    }, [batchMode]);

    const _onDrop = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (!onDragEnd || fromIndex === toIndex) {
                // 没有移动
                return;
            }
            const newData = musicList
                .slice(0, fromIndex)
                .concat(musicList.slice(fromIndex + 1));
            newData.splice(
                fromIndex > toIndex ? toIndex : toIndex - 1,
                0,
                musicList[fromIndex],
            );
            onDragEnd?.(newData);
        },
        [onDragEnd, musicList],
    );

    return (
        <div
            className="music-list-container"
            style={containerStyle}
            ref={tableContainerRef}
            tabIndex={-1}
            onFocus={() => {
                hotkeys.setScope("music-list");
            }}
            onBlur={() => {
                hotkeys.setScope("all");
            }}
        >
            <div className="music-list-batch-actions">
                <div className="batch-actions-left">
                    {batchMode ? <>
                        <span>已选 {selectedMusic.size} 首</span>
                        <button type="button" onClick={() => {
                            const items = table.getRowModel().rows.flatMap((row) =>
                                row.subRows.length ? row.getLeafRows().map((child) => child.original) : [row.original],
                            );
                            setSelectedMusic(new Map(items.map((item) => [getMediaPrimaryKey(item), item])));
                        }}>全选</button>
                        <button type="button" disabled={!selectedMusic.size} onClick={() => setSelectedMusic(new Map())}>取消选择</button>
                        <button type="button" disabled={!selectedMusic.size} onClick={() => {
                            showModal("AddMusicToSheet", { musicItems: [...selectedMusic.values()] });
                        }}>添加到歌单</button>
                        <button type="button" onClick={() => {
                            setBatchMode(false);
                            setSelectedMusic(new Map());
                        }}>完成</button>
                    </> : <button type="button" disabled={!musicList.length} onClick={() => setBatchMode(true)}>多选</button>}
                </div>
                {headerExtra ? <div className="batch-actions-right">{headerExtra}</div> : null}
            </div>
            <table
                style={{
                    height: virtualController.totalHeight + estimizeItemHeight,
                    tableLayout: "fixed",
                }}
            >
                <thead>
                    <tr>
                        {table.getHeaderGroups()[0].headers.map((header) => (
                            <th
                                key={header.id}
                                data-id={header.id}
                                style={{ width: columnWidths[header.id] }}
                            >
                                {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody
                    style={{
                        transform: `translateY(${virtualController.startTop}px)`,
                    }}
                >
                    {virtualController.virtualItems.map((virtualItem, index) => {
                        const row = virtualItem.dataItem;

                        if (!row.original) {
                            return null;
                        }
                        // todo 拆出一个组件
                        return (
                            <tr
                                key={row.id}
                                data-active={
                                    batchMode ? selectedMusic.has(getMediaPrimaryKey(row.original)) : activeItems.has(virtualItem.rowIndex)
                                }
                                onContextMenu={(e) => {
                                    if (
                                        activeItems.size > 1
                                    ) {
                                        const selectedItems: IMusic.IMusicItem[] = [];
                                        const rows = table.getRowModel().rows;
                                        activeItems.forEach(item => {
                                            selectedItems.push(rows[item].original);
                                        });

                                        showMusicContextMenu(
                                            selectedItems,
                                            e.clientX,
                                            e.clientY,
                                            musicSheet?.platform === localPluginName
                                                ? musicSheet.id
                                                : undefined,
                                        );
                                    } else {
                                        lastActiveIndexRef.current = virtualItem.rowIndex;
                                        setActiveItems(new Set([virtualItem.rowIndex]));
                                        showMusicContextMenu(
                                            row.original,
                                            e.clientX,
                                            e.clientY,
                                            musicSheet?.platform === localPluginName
                                                ? musicSheet.id
                                                : undefined,
                                        );
                                    }
                                }}
                                onClick={() => {
                                    if (batchMode) {
                                        toggleSelection(row.subRows.length ? row.getLeafRows().map((child) => child.original) : [row.original]);
                                        return;
                                    }
                                    // 如果点击的时候按下shift
                                    if (hotkeys.shift) {
                                        let start = lastActiveIndexRef.current;
                                        let end = virtualItem.rowIndex;

                                        if (start >= end) {
                                            [start, end] = [end, start];
                                        }

                                        if (end > musicListRef.current.length) {
                                            end = musicListRef.current.length - 1;
                                        }

                                        setActiveItems(
                                            new Set(
                                                Array.from({ length: end - start + 1 }, (_, i) => start + i),
                                            ),
                                        );
                                    } else if (hotkeys.ctrl) {
                                        const newSet = new Set(activeItems);
                                        if (newSet.has(virtualItem.rowIndex)) {
                                            newSet.delete(virtualItem.rowIndex);
                                        } else {
                                            newSet.add(virtualItem.rowIndex);
                                        }
                                        setActiveItems(newSet);
                                    } else {
                                        setActiveItems(new Set([virtualItem.rowIndex]));
                                        lastActiveIndexRef.current = virtualItem.rowIndex;
                                    }
                                }}
                                onDoubleClick={() => {
                                    if (batchMode) {
                                        return;
                                    }
                                    const musicToPlay = row.getIsExpanded() ? row.subRows[0].original : row.original;
                                    const config =
                                    doubleClickBehavior ??
                                    AppConfig.getConfig("playMusic.clickMusicList");
                                    if (config === "replace") {
                                        trackPlayer.playMusicWithReplaceQueue(
                                            table.getRowModel().rows.filter((it) => !it.getIsExpanded()).map((it) => it.original),
                                            musicToPlay,
                                        );
                                    } else {
                                        trackPlayer.playMusic(musicToPlay);
                                    }
                                }}
                                draggable={enableDrag && !batchMode && !table.getIsSomeRowsExpanded()}
                                onDragStart={(e) => {
                                // TODO
                                // if(activeItems) {

                                    // }
                                    startDrag(e, virtualItem.rowIndex, "musiclist");
                                }}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        data-id={cell.column.id}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                                <IfTruthy condition={enableDrag && !batchMode && !table.getIsSomeRowsExpanded()}>
                                    <IfTruthy condition={index === 0}>
                                        <DragReceiver
                                            position="top"
                                            rowIndex={virtualItem.rowIndex}
                                            onDrop={_onDrop}
                                            tag="musiclist"
                                            insideTable
                                        ></DragReceiver>
                                    </IfTruthy>
                                    <DragReceiver
                                        position="bottom"
                                        rowIndex={virtualItem.rowIndex + 1}
                                        onDrop={_onDrop}
                                        tag="musiclist"
                                        insideTable
                                    ></DragReceiver>
                                </IfTruthy>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot
                    style={{
                        height:
                            virtualController.totalHeight -
                            virtualController.virtualItems.length * estimizeItemHeight,
                    }}
                ></tfoot>
            </table>
            <Condition
                condition={musicList.length === 0}
                falsy={
                    <BottomLoadingState
                        state={state}
                        onLoadMore={onPageChange}
                    ></BottomLoadingState>
                }
            >
                <Empty></Empty>
            </Condition>
        </div>
    );
}

export default memo(
    _MusicList,
    (prev, curr) =>
        prev.state === curr.state &&
        prev.enableDrag === curr.enableDrag &&
        prev.musicList === curr.musicList &&
        prev.onPageChange === curr.onPageChange &&
        prev.onDragEnd === curr.onDragEnd &&
        prev.musicSheet &&
        curr.musicSheet &&
        isSameMedia(prev.musicSheet, curr.musicSheet),
);
