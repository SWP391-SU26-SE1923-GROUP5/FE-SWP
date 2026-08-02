import Image from "next/image";
import {cn} from "@/lib/utils";
import {DynamicFileIcon} from "@/components/DynamicFileIcon";

interface Props {
    type: string;
    extension: string;
    url?: string;
    imageClassName?: string;
    className?: string;
}

const Thumbnail = ({ type, extension, url = "", imageClassName, className }: Props) => {
    const cleanExt = extension.replace('.', '').toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    
    // Only try to load actual image if it's a temporary local blob (during upload)
    const isImage = url.startsWith('blob:') && (imageExtensions.includes(cleanExt) || (type === 'image' && cleanExt !== 'svg'));
    
    return (
        <figure className={cn("thumbnail", className)}>
            {isImage ? (
                <Image
                    src={url}
                    alt="thumbnail"
                    width={100}
                    height={100}
                    className={cn("size-8 object-contain", imageClassName, "thumbnail-image")}
                    unoptimized={true}
                />
            ) : (
                <DynamicFileIcon extension={cleanExt} type={type} className={cn("size-8 object-contain", imageClassName)} />
            )}
        </figure>
    )
}
export default Thumbnail
