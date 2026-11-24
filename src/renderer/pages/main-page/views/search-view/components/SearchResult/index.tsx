import { useEffect, memo } from "react";
import "./index.scss";
import Condition from "@/renderer/components/Condition";
import AlbumResult from "./AlbumResult";
import MusicResult from "./MusicResult";
import ArtistResult from "./ArtistResult";
import { searchResultsStore } from "../../store/search-result";
import { RequestStateCode } from "@/common/constant";
import Loading from "@/renderer/components/Loading";
import useSearch from "../../hooks/useSearch";
import SwitchCase from "@/renderer/components/SwitchCase";

import SheetResult from "./SheetResult";

interface ISearchResultProps {
    type: IMedia.SupportMediaType;
    query: string;
    plugins: IPlugin.IPluginDelegate[];
}

export default function SearchResult(props: ISearchResultProps) {
    const { type, plugins, query } = props;
    const selectedPlugin = plugins[0];

    return (
        <>
            <SearchResultBody
                query={query}
                type={type}
                pluginHash={selectedPlugin?.hash}
            ></SearchResultBody>
        </>
    );
}

interface ISearchResultBodyProps {
    type: IMedia.SupportMediaType;
    pluginHash: string;
    query: string;
}
function _SearchResultBody(props: ISearchResultBodyProps) {
    const { type, pluginHash, query } = props;
    const searchResults = searchResultsStore.useValue();
    const currentResult = searchResults[type][pluginHash];
    const data = currentResult?.data ?? ([] as any[]);

    const search = useSearch();

    useEffect(() => {
        if (pluginHash && type && query) {
            search(query, 1, type, pluginHash);
        }
    }, [pluginHash, type, query]);

    return (
        <>
            <Condition
                condition={
                    currentResult?.state !== RequestStateCode.PENDING_FIRST_PAGE ||
          !pluginHash
                }
                falsy={<Loading></Loading>}
            >
                <SwitchCase.Switch switch={type}>
                    <SwitchCase.Case case="music">
                        <MusicResult
                            data={data}
                            state={currentResult?.state ?? RequestStateCode.IDLE}
                            pluginHash={pluginHash}
                        ></MusicResult>
                    </SwitchCase.Case>
                    <SwitchCase.Case case="album">
                        <AlbumResult
                            data={data}
                            state={currentResult?.state ?? RequestStateCode.IDLE}
                            pluginHash={pluginHash}
                        ></AlbumResult>
                    </SwitchCase.Case>
                    <SwitchCase.Case case="artist">
                        <ArtistResult
                            data={data}
                            state={currentResult?.state ?? RequestStateCode.IDLE}
                            pluginHash={pluginHash}
                        ></ArtistResult>
                    </SwitchCase.Case>
                    <SwitchCase.Case case="sheet">
                        <SheetResult
                            data={data}
                            state={currentResult?.state ?? RequestStateCode.IDLE}
                            pluginHash={pluginHash}
                        ></SheetResult>
                    </SwitchCase.Case>
                </SwitchCase.Switch>
            </Condition>
        </>
    );
}

const SearchResultBody = memo(
    _SearchResultBody,
    (prev, curr) => prev.pluginHash === curr.pluginHash && prev.type === curr.type,
);
