import { LRUCache } from "lru-cache";
import PQueue from "p-queue";
import { getMediaPrimaryKey } from "@/common/media-util";
import PluginManager from "@shared/plugin-manager/renderer";

const queue = new PQueue({ concurrency: 3 });
const collections = new LRUCache<string, Promise<IMusic.IMusicItem[]>>({
    max: 128,
    ttl: 5 * 60 * 1000,
});

export default function getBilibiliCollection(item: IMusic.IMusicItem): Promise<IMusic.IMusicItem[]> {
    const key = getBilibiliCollectionKey(item);
    const cached = collections.get(key);
    if (cached) {
        return cached;
    }
    const result = queue.add(async () => {
        const album = await PluginManager.callPluginDelegateMethod(
            item, "getAlbumInfo", { ...item, description: item.description ?? "" }, 1,
        );
        if (!Array.isArray(album?.musicList)) {
            throw new Error("合集信息加载失败");
        }
        return album.musicList.map((part: IMusic.IMusicItem) => ({
            ...item,
            ...part,
            id: String(part.cid ?? part.id),
        }));
    }) as Promise<IMusic.IMusicItem[]>;
    collections.set(key, result);
    result.catch(() => {
        collections.delete(key);
    });
    return result;
}

export function getBilibiliCollectionKey(item: IMusic.IMusicItem) {
    return getMediaPrimaryKey({ ...item, id: item.id || item.bvid || item.aid });
}
