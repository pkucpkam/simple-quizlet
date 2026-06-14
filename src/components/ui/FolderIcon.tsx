import { Folder } from "lucide-react";
import { FOLDER_ICONS } from "./folderIcons";

/** Render icon theo tên lưu trong DB — fallback về Folder */
export default function FolderIcon({
    name,
    className = "h-5 w-5",
    style,
}: {
    name?: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    const entry = FOLDER_ICONS.find((i) => i.name === name);
    const Icon = entry?.Icon ?? Folder;
    return <Icon className={className} style={style} />;
}
