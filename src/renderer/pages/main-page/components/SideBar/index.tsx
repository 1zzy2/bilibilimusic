import ListItem from "./widgets/ListItem";
import "./index.scss";
import MySheets from "./widgets/MySheets";
import { useMatch, useNavigate } from "react-router";

import { useTranslation } from "react-i18next";

export default function () {
    const navigate = useNavigate();
    const routePathMatch = useMatch("/main/:routePath");
    const { t } = useTranslation();

    const options = [
        {
            iconName: "clock",
            title: t("side_bar.recently_play"),
            route: "recently_play",
        },
    ] as const;

    return (
        <div className="side-bar-container">
            {options.map((item) => (
                <ListItem
                    key={item.route}
                    iconName={item.iconName}
                    title={item.title}
                    selected={routePathMatch?.params?.routePath === item.route}
                    onClick={() => {
                        navigate(`/main/${item.route}`);
                    }}
                ></ListItem>
            ))}
            <MySheets></MySheets>
        </div>
    );
}
