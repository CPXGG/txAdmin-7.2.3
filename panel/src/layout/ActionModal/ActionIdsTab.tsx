import { txToast } from "@/components/TxToaster";
import { cn, copyToClipboard } from "@/lib/utils";
import { CopyIcon, Unlink } from "lucide-react";
import { useState } from "react";
import { DatabaseActionType } from "../../../../core/components/PlayerDatabase/databaseTypes";
import { useAdminPerms } from "@/hooks/auth";
import { useBackendApi } from "@/hooks/fetch";
import { GenericApiOkResp } from "@shared/genericApiTypes";


type IdsBlockProps = {
    title: string,
    emptyMessage: string,
    ids: string[] | undefined,
    isSmaller?: boolean,
    actionId: string,
    isHwid: boolean,
    refreshModalData: () => void,
}
function IdsBlock({ title, emptyMessage, ids, isSmaller, actionId, isHwid, refreshModalData }: IdsBlockProps) {
    const [hasCopiedIds, setHasCopiedIds] = useState(false);
    const [displayCurrIds, setDisplayCurrIds] = useState(ids ? ids.sort((a, b) => a.localeCompare(b)) : []);
    const [isLoading, setIsLoading] = useState(false);
    const { hasPerm } = useAdminPerms();
    const hasBanPerm = hasPerm('players.ban');
    const unlinkIdApi = useBackendApi<GenericApiOkResp>({
        method: 'POST',
        path: isHwid ? '/history/unlink_hwid' : '/history/unlink_id',
        throwGenericErrors: true,
    });

    const handleCopyIds = () => {
        if (!ids) return;
        copyToClipboard(ids.join('\n')).then((res) => {
            if (res !== false) {
                setHasCopiedIds(true);
            } else {
                txToast.error('Failed to copy to clipboard :(');
            }
        }).catch((error) => {
            txToast.error({
                title: 'Failed to copy to clipboard:',
                msg: error.message,
            });
        });
    }

    const handleUnlinkId = (id: string) => {
        if (isLoading) return;
        setIsLoading(true);
        unlinkIdApi({
            queryParams: {actionId},
            data: {id},
            toastLoadingMessage: 'Unlinking identifier...',
            genericHandler: {
                successMsg: 'Unlink identifier successfully.',
            },
            success: (data) => {
                setDisplayCurrIds(displayCurrIds.filter(currId => currId !== id));
                setIsLoading(false);
                refreshModalData();
            }
        });
    }

    return <div className="px-1 mb-1 md:mb-4">
        <div className="flex justify-between items-center pb-1">
            <h3 className="text-xl">{title}</h3>
            {hasCopiedIds ? (
                <span className="text-sm text-success-inline">Copied!</span>
            ) : (
                // TODO: a button to erase the ids from the database can be added here,
                // requires tooltip and confirm modal though
                <button onClick={handleCopyIds}>
                    <CopyIcon className="h-4 text-secondary hover:text-primary" />
                </button>
            )}
        </div>
        <p className={cn(
            "font-mono break-all whitespace-pre-wrap border rounded divide-y divide-border/50 text-muted-foreground",
            displayCurrIds.length && isSmaller ? "text-2xs leading-5 font-extralight tracking-widest" : "text-xs leading-6 tracking-wider"
        )}>
            {displayCurrIds.length ? displayCurrIds.map((id) => (
                <div className="flex justify-between items-center" key={id}>
                    <span key={id} className="px-1 font-semibold">{id}</span>
                    {hasBanPerm && (
                        <div
                            onClick={() => handleUnlinkId(id)}
                            className="text-background hover:text-muted-foreground hover:cursor-pointer"
                        ><Unlink className="size-3.5" /></div>
                    )}
                </div>
            )) : (
                <span className="block px-1 opacity-50 italic">{emptyMessage}</span>
            )}
        </p>
    </div>
}


export default function ActionIdsTab({ action, refreshModalData }: { action: DatabaseActionType, refreshModalData: () => void }) {
    return <div className="flex flex-col gap-4">
        <IdsBlock
            title="Target Identifiers"
            emptyMessage="This action targets no identifiers."
            ids={action.ids}
            actionId={action.id}
            isHwid={false}
            refreshModalData={refreshModalData}
        />
        <IdsBlock
            title="Target Hardware IDs"
            emptyMessage="This action targets no hardware IDs."
            ids={action.hwids}
            isSmaller
            actionId={action.id}
            isHwid={true}
            refreshModalData={refreshModalData}
        />
    </div>;
}
