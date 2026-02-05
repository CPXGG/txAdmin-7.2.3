import DateTimeCorrected from "@/components/DateTimeCorrected";
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
	ids: string[],
	hwids: string[],
}
function IdsBlock({ title, emptyMessage, ids, hwids }: IdsBlockProps) {
    const [hasCopiedIds, setHasCopiedIds] = useState(false);
	const currentIds = [...ids, ...hwids];

    const handleCopyIds = () => {
        //Just to guarantee the correct visual order
        copyToClipboard(currentIds.join('\n')).then((res) => {
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

    return <div>
        <div className="flex justify-between items-center pb-1">
            <h3>{title}</h3>
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
            "font-mono break-all whitespace-pre-wrap border rounded divide-y divide-border/50 text-muted-foreground text-xs leading-6 tracking-wider"
        )}>
            {currentIds.length === 0 && <span className="block px-1 opacity-50 italic">{emptyMessage}</span>}
            {currentIds.map((id) => (
                <div className="flex justify-between items-center overflow-hidden" key={id}>
                    <span key={id} className="px-1 font-semibold truncate">{id}</span>
                </div>
            ))}
        </p>
    </div>
}


export default function PlayerLastConnection({ player, serverTime, tsFetch }: { player: PlayerModalPlayerData, serverTime: number, tsFetch: number }) {
    return <div className="flex flex-col gap-4 w-full">
		<div className="py-0.5 grid grid-cols-3 gap-4 px-0">
			<dt className="text-sm font-medium leading-6 text-muted-foreground">Last Connection</dt>
			<dd className="text-sm leading-6 col-span-2 mt-0">{
				player.lastConnectionData?.timestamp ?
				<DateTimeCorrected
					serverTime={serverTime}
					tsObject={player.lastConnectionData.timestamp}
					tsFetch={tsFetch}
					isDateOnly={false}
				/> :
				'??/??/????, ??:??'
			}</dd>
		</div>
        <IdsBlock
            title="Ids"
            emptyMessage="This player has no identifiers."
			ids={player.lastConnectionData?.ids || []}
			hwids={player.lastConnectionData?.hwids || []}
        />
    </div>;
}
