import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";

interface MyPluginSettings {
  dailyNotesFolder: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  dailyNotesFolder: "Daily",
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "open-random-daily-note",
      name: "Open Random Daily Note",
      callback: () => {
        this.openRandomDailyNote();
      },
    });

    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  async openRandomDailyNote() {
    const dailyNotes = await this.getDailyNotes();
    if (dailyNotes.length === 0) {
      new Notice("No daily notes found.");
      return;
    }

    const randomNote =
      dailyNotes[Math.floor(Math.random() * dailyNotes.length)];
    const leaf = this.app.workspace.getUnpinnedLeaf();
    await leaf.openFile(randomNote);

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const editor = view.editor;
      const headings = this.getHeadingsInEditor(editor);
      if (headings.length > 0) {
        const randomHeading =
          headings[Math.floor(Math.random() * headings.length)];
        this.navigateToHeading(editor, randomHeading);
      }
    }
  }

  async getDailyNotes(): Promise<TFile[]> {
    const dailyNotesFolder = this.settings.dailyNotesFolder;
    const vault = this.app.vault;
    const files = await vault.getFiles();
    return files.filter((file) => file.path.startsWith(`${dailyNotesFolder}/`));
  }

  getHeadingsInEditor(editor: Editor): { line: number; text: string }[] {
    const headings: { line: number; text: string }[] = [];
    const lines = editor.getValue().split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("## ")) {
        headings.push({ line: i, text: line.slice(3).trim() });
      }
    }
    return headings;
  }

  navigateToHeading(editor: Editor, heading: { line: number; text: string }) {
    const { line } = heading;
    editor.setCursor({ line, ch: 0 });
    editor.scrollIntoView({ from: { line, ch: 0 }, to: { line, ch: 0 } }, true);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Daily Notes Folder")
      .setDesc("The folder where your daily notes are stored.")
      .addText((text) =>
        text
          .setPlaceholder("Daily")
          .setValue(this.plugin.settings.dailyNotesFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyNotesFolder = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
