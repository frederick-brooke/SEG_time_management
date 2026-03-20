import { Zap } from "lucide-react";

//types
interface PointsCardProps {
  totalPoints: number;
  level: number;
  xpToNext: number;
  xpBarWidth: number;
}

//component
/**
 * Displays total points earned, current level, and XP progress to next level
 * @param {PointsCardProps} props - Points and level data
 * @return {JSX.Element} - Points card
 */
export default function PointsCard({ totalPoints, level, xpToNext, xpBarWidth }: PointsCardProps) {
  return (
    <div className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-400 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md">
            <Zap size={28} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Total Points Earned</p>
            <p className="text-4xl font-black text-gray-900">{totalPoints.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level</p>
            <p className="text-3xl font-black text-yellow-600">{level}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Level</p>
            <p className="text-lg font-bold text-gray-500">{xpToNext} XP away</p>
            <div className="w-32 h-2 bg-yellow-100 rounded-full overflow-hidden mt-1 border border-yellow-200">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
                style={{ width: `${xpBarWidth}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}