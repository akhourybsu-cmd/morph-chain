import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { MorphChainTitle, MorphPrismTitle, MorphRushTitle } from "@/components/GameTitles";

export const RushLogo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isOnChain = location.pathname === '/chain';
  const isOnPrism = location.pathname === '/prism';
  const isOnRush = location.pathname.startsWith('/rush');
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${className}`}>
        <MorphRushTitle className="text-base sm:text-xl" />
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 bg-popover z-50">
        <DropdownMenuItem 
          onClick={() => navigate('/chain')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <MorphChainTitle className="text-sm" />
              <span className="text-xs text-muted-foreground">Word ladder</span>
            </div>
            {isOnChain && <Check className="h-4 w-4 text-primary ml-2" />}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/prism')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <MorphPrismTitle className="text-sm" />
              <span className="text-xs text-muted-foreground">Color ladder</span>
            </div>
            {isOnPrism && <Check className="h-4 w-4 text-primary ml-2" />}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/rush?mode=daily')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <MorphRushTitle className="text-sm" />
              <span className="text-xs text-muted-foreground">Score dash</span>
            </div>
            {isOnRush && <Check className="h-4 w-4 text-primary ml-2" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
