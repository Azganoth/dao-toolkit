// Custom title bar is already handled by tauri decorum plugin
function TitleBar() {
  return (
    <header className="fixed top-0 right-0 left-0 z-90 mr-[174px] flex h-8 items-center px-1">
      <img src="/app-icon.svg" alt="" className="mr-1 ml-0.5 size-6" />
      <h1 className="text-sm">DAO Toolkit</h1>
    </header>
  );
}

export { TitleBar };
