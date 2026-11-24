import "./index.scss";
import { Trans, useTranslation } from "react-i18next";

interface INoPluginProps {
    supportMethod?: string;
    height?: number | string;
}

export default function NoPlugin(props: INoPluginProps) {
    const { supportMethod, height } = props ?? {};

    const { t } = useTranslation();

    return (
        <div
            className="no-plugin-container"
            style={{
                height: height,
            }}
        >
            <span>
                {supportMethod ? (
                    <Trans
                        i18nKey={
                            "plugin.info_hint_you_have_no_plugin_with_supported_method"
                        }
                        components={{
                            highlight: <span className="highlight"></span>,
                        }}
                        values={{
                            supportMethod,
                        }}
                    ></Trans>
                ) : (
                    t("plugin.info_hint_you_have_no_plugin")
                )}
            </span>
            <span>
                默认音源暂不可用，请检查网络后重新启动。
            </span>
        </div>
    );
}
