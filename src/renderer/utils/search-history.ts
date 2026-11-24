import { getUserPreferenceIDB, setUserPreferenceIDB } from "./user-perference";

const maxHistoryLength = 10;
let pendingUpdate = Promise.resolve();

function updateHistory(update: (history: string[]) => string[]) {
    const task = pendingUpdate.then(async () => {
        const history = (await getUserPreferenceIDB("searchHistory")) ?? [];
        await setUserPreferenceIDB("searchHistory", update(history).slice(0, maxHistoryLength));
    });
    pendingUpdate = task.catch(() => {
        // 单次写入失败后，后续操作仍然可以重试。
    });
    return task;
}

export async function getSearchHistory() {
    await pendingUpdate;
    const history = (await getUserPreferenceIDB("searchHistory")) ?? [];
    if (history.length > maxHistoryLength) {
        await updateHistory((items) => items);
    }
    return history.slice(0, maxHistoryLength);
}

export async function addSearchHistory(searchItem: string) {
    const keyword = searchItem.trim();
    if (!keyword) {
        return;
    }
    await updateHistory((history) => [keyword, ...history.filter((item) => item !== keyword)]);
}

export async function removeSearchHistory(searchItem: string) {
    await updateHistory((history) => history.filter((item) => item !== searchItem));
}

export async function clearSearchHistory() {
    await updateHistory(() => []);
}
