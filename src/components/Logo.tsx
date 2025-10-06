import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${className}`}>
        <span 
          className="font-outfit font-semibold text-base sm:text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap"
          style={{ letterSpacing: '-0.02em' }}
        >
          MORPH CHAIN
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/')}>
          <div className="flex flex-col">
            <span className="font-semibold">MORPH CHAIN</span>
            <span className="text-xs text-muted-foreground">Daily word transformation</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/prism')}>
          <div className="flex flex-col">
            <span className="font-semibold">MORPH PRISM</span>
            <span className="text-xs text-muted-foreground">Daily color puzzle</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
