import { Build } from "../api/Builds";
import { FlashDialog } from "./FlashDialog";

interface Props {
    builds: Build[];
}

export default function BuildList({ builds }: Props) {
    if (!builds.length) return <p>Brak buildów.</p>;
    return (
        <table className="w-full text-left mt-4">
            <thead>
            <tr className="border-b border-gray-300">
                <th className="py-2 w-1/10">Version</th>
                <th className="py-2 w-1/10">Stage</th>
                <th className="py-2 whitespace-nowrap w-max">Date</th>
                <th className="py-2 w-1/10"/>
            </tr>
            </thead>
            <tbody>
            {builds.map((b) => (
                <tr key={b.version} className="group border-b border-gray-200">
                    <td className="py-2 w-1/10 font-mono">{b.version}</td>
                    <td className="py-2 w-1/10">{b.stage}</td>
                    <td className="py-2 whitespace-nowrap w-max">{new Date(b.date).toLocaleString('pl-PL')}</td>
                    <td className="py-2 text-left w-1/10">
                        <div className="invisible group-hover:visible">
                            <FlashDialog build={b}/>
                        </div>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
