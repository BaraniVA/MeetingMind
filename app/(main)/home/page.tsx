import HomePage from "./home-page";
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
            <HomePage/> 
        </div>
      </SidebarInset>
 
  )
}