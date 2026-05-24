'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, Trash2, CalendarDays } from 'lucide-react';
import { Rencana } from '@/types';
import { CreateRencanaDialog } from './CreateRencanaDialog';

interface RencanaHeaderProps {
  rencanaList: Rencana[];
  activeRencana: Rencana | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, location?: any) => void;
  onDelete: (id: string) => void;
}

export function RencanaHeader({ rencanaList, activeRencana, onSelect, onCreate, onDelete }: RencanaHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent text-left block w-full group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">RENCANA AKTIF</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
              </div>
              <h1 className="text-2xl font-black truncate max-w-[200px] text-primary">
                {activeRencana ? activeRencana.name : 'PILIH RENCANA...'}
              </h1>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass w-64 p-2">
            {rencanaList.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center italic">Belum ada rencana, buat dolo!</p>
            )}
            {rencanaList.map((r) => (
              <div key={r.id} className="flex items-center gap-1">
                <DropdownMenuItem 
                  className="flex-1 cursor-pointer font-bold h-10 px-3"
                  onClick={() => onSelect(r.id)}
                >
                  <span className="truncate">{r.name}</span>
                </DropdownMenuItem>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-400 shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(r.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              className="cursor-pointer font-bold h-10 px-3 text-accent focus:text-accent focus:bg-accent/10"
              onSelect={(e) => {
                e.preventDefault();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> BUAT RENCANA BARU
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-2 bg-secondary rounded-2xl flex items-center gap-2 border border-white/5 shadow-inner">
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase">
          {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Dialog dipindah ke luar DropdownContent supaya tidak ada konflik Focus */}
      <CreateRencanaDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreate={(name, loc) => {
          onCreate(name, loc);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
