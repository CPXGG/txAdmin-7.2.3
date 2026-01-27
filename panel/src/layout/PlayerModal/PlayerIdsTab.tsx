import { txToast } from "@/components/TxToaster";
import { cn, copyToClipboard } from "@/lib/utils";
import { PlayerModalPlayerData } from "@shared/playerApiTypes";
import { CopyIcon, Unlink } from "lucide-react";
import { useState } from "react";
import { useAdminPerms } from "@/hooks/auth";
import { useBackendApi } from "@/hooks/fetch";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import { PlayerModalRefType } from "@/hooks/playerModal";


type IdsBlockProps = {
    title: string,
    emptyMessage: string,
    currIds: string[],
    allIds: string[],
    isSmaller?: boolean,
    playerRef: PlayerModalRefType;
    isHwid: boolean,
}
function IdsBlock({ title, emptyMessage, currIds, allIds, isSmaller, playerRef, isHwid }: IdsBlockProps) {
    const [hasCopiedIds, setHasCopiedIds] = useState(false);
    const [displayCurrIds, setDisplayCurrIds] = useState(currIds.sort((a, b) => a.localeCompare(b)));
    const displayOldIds = allIds.filter((id) => !currIds.includes(id)).sort((a, b) => a.localeCompare(b));
    const [isLoading, setIsLoading] = useState(false);
    const { hasPerm } = useAdminPerms();
    const hasBanPerm = hasPerm('players.ban');
    const unlinkIdApi = useBackendApi<GenericApiOkResp>({
        method: 'POST',
        path: isHwid ? '/player/unlink_hwid' : '/player/unlink_id',
        throwGenericErrors: true,
    });

    const handleCopyIds = () => {
        //Just to guarantee the correct visual order
        const arrToCopy = [...displayCurrIds, ...displayOldIds];
        copyToClipboard(arrToCopy.join('\n')).then((res) => {
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
            queryParams: playerRef,
            data: {id},
            toastLoadingMessage: 'Unlinking identifier...',
            genericHandler: {
                successMsg: 'Unlink identifier successfully.',
            },
            success: (data) => {
                setDisplayCurrIds(displayCurrIds.filter(currId => currId !== id));
                setIsLoading(false);
            }
        });
    }

    return <div>
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
            isSmaller ? "text-2xs leading-5 font-extralight tracking-widest" : "text-xs leading-6 tracking-wider"
        )}>
            {displayCurrIds.length === 0 && <span className="block px-1 opacity-50 italic">{emptyMessage}</span>}
            {displayCurrIds.map((id) => (
                <div className="flex justify-between items-center" key={id}>
                    <span key={id} className="px-1 font-semibold">{id}</span>
                    {hasBanPerm && (
                        <div
                            onClick={() => handleUnlinkId(id)}
                            className="text-background hover:text-muted-foreground hover:cursor-pointer"
                        ><Unlink className="size-3.5" /></div>
                    )}
                </div>
            ))}
            {displayOldIds.map((id) => (
                <span key={id} className="block px-1 opacity-50">{id}</span>
            ))}
        </p>
    </div>
}


export default function PlayerIdsTab({ player, playerRef }: { player: PlayerModalPlayerData, playerRef: PlayerModalRefType; }) {
    return <div className="flex flex-col gap-4 p-1">
        <IdsBlock
            title="Player Identifiers"
            emptyMessage="This player has no identifiers."
            currIds={player.ids}
            allIds={player?.oldIds ?? []}
            playerRef={playerRef}
            isHwid={false}
        />
        <IdsBlock
            title="Player Hardware IDs"
            emptyMessage="This player has no hardware IDs."
            currIds={player.hwids}
            allIds={player?.oldHwids ?? []}
            isSmaller
            playerRef={playerRef}
            isHwid={true}
        />
    </div>;
}
