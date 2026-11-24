import SvgAsset from "@/renderer/components/SvgAsset";
import "./index.scss";
import { useEffect, useRef, useState } from "react";
import {
    clearSearchHistory,
    getSearchHistory,
    removeSearchHistory,
} from "@/renderer/utils/search-history";
import Condition from "@/renderer/components/Condition";
import { useTranslation } from "react-i18next";

interface ISearchHistoryProps {
    onHistoryClick: (item: string) => void;
    onHistoryPanelFocus?: () => void;
    onHistoryPanelBlur?: () => void;
}

export default function SearchHistory(props: ISearchHistoryProps) {
    const { onHistoryClick, onHistoryPanelBlur, onHistoryPanelFocus } = props;
    const [historyList, removeHistory] = useSearchHistory();
    const { t } = useTranslation();
    const panelRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className="search-history--container"
            ref={panelRef}
            tabIndex={-1}
            onFocus={onHistoryPanelFocus}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    onHistoryPanelBlur?.();
                }
            }}
        >
            <div className="search-history--header">
                {t("app_header.search_history")}
                <button
                    type="button"
                    className="search-history--header-clear"
                    title="清空搜索历史"
                    aria-label="清空搜索历史"
                    disabled={!historyList.length}
                    onClick={() => {
                        panelRef.current?.focus();
                        removeHistory();
                    }}
                >
                    <SvgAsset iconName="trash"></SvgAsset>
                </button>
            </div>
            <div className="search-history--body">
                <Condition
                    condition={historyList?.length}
                    falsy={
                        <div className="search-history--empty">暂无搜索记录</div>
                    }
                >
                    {historyList.map((historyItem) => (
                        <div
                            className="search-history--item"
                            key={historyItem}
                        >
                            <button
                                type="button"
                                className="search-history--keyword"
                                title={historyItem}
                                onClick={() => onHistoryClick?.(historyItem)}
                            ><span>{historyItem}</span></button>
                            <button
                                type="button"
                                className="search-history--item-remove"
                                title="删除此记录"
                                aria-label={`删除搜索记录 ${historyItem}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    panelRef.current?.focus();
                                    removeHistory(historyItem);
                                }}
                            >
                                <SvgAsset iconName="x-mark"></SvgAsset>
                            </button>
                        </div>
                    ))}
                </Condition>
            </div>
        </div>
    );
}

function useSearchHistory() {
    const [historyList, setHistoryList] = useState<string[]>([]);

    function refreshHistoryList() {
        getSearchHistory().then((res) => {
            setHistoryList(res);
        });
    }

    useEffect(() => {
        refreshHistoryList();
    }, []);

    async function removeHistory(item?: string) {
        if (!item) {
            await clearSearchHistory();
        } else {
            await removeSearchHistory(item);
        }
        refreshHistoryList();
    }

    return [historyList, removeHistory] as const;
}
