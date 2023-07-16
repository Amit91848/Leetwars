import { Player } from "../types/Player";

export function Players({ players }: { players: Player[] | undefined }) {
    return (
        <>
            <div className="mb-3 mt-3 flex flex-col overflow-auto text-sm font-medium text-white">
                {players
                    ? players.map((player) => {
                          return (
                              <div
                                  className=" px-5 py-2 odd:bg-lc-bg odd:bg-opacity-[45%]"
                                  key={player.id}
                              >
                                  {player.username}
                              </div>
                          );
                      })
                    : null}
            </div>
        </>
    );
}
