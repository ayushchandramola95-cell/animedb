"use client";

import Link from "next/link";
import { Users, Clapperboard, Music, UserCheck } from "lucide-react";

interface StaffEdge {
  role: string;
  node: {
    id: number;
    name: {
      full: string;
    };
    image: {
      medium: string;
      large?: string;
    };
  };
}

interface KeyStaffDirectoryProps {
  staff?: {
    edges: StaffEdge[];
  };
}

export default function KeyStaffDirectory({ staff }: KeyStaffDirectoryProps) {
  if (!staff || !staff.edges || staff.edges.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-[#131622] border border-[#222736] p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Key Production Staff & Creators
          </h3>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline-block">
          Direction, Composition & Music
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {staff.edges.slice(0, 8).map((edge, idx) => {
          const person = edge.node;
          const isDirector = edge.role.toLowerCase().includes("director");
          const isMusic = edge.role.toLowerCase().includes("music");

          return (
            <Link
              key={idx}
              href={`/staff/${person.id}`}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181c28] border border-[#252b3d] hover:border-emerald-500/50 hover:bg-[#1c2130] transition-colors group"
              title={`View ${person.name.full}'s profile and works`}
            >
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#10131a] flex-shrink-0 border border-[#23293a] group-hover:border-emerald-500/40 flex items-center justify-center">
                {person.image?.large || person.image?.medium ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.image.large || person.image.medium}
                    alt={person.name?.full || "Staff"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <UserCheck className="w-5 h-5 text-gray-500" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-100 group-hover:text-emerald-400 truncate transition-colors">
                  {person.name.full}
                </span>
                <span className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                  {isDirector ? (
                    <span className="text-emerald-400 font-semibold truncate">{edge.role}</span>
                  ) : isMusic ? (
                    <span className="text-purple-400 font-semibold truncate">{edge.role}</span>
                  ) : (
                    <span className="truncate">{edge.role}</span>
                  )}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
