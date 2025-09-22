import "@/App.css";
import { TitleBar } from "@/components/TitleBar";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <>
      <TitleBar />
      <main className="mt-8 p-4">
        <p>
          An easy-to-use desktop application for managing your{" "}
          <strong>Dragon Age: Origins</strong> mods.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            id="greet-input"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button type="submit">Greet</button>
        </form>
        <p>{greetMsg}</p>
      </main>
    </>
  );
}

export default App;
