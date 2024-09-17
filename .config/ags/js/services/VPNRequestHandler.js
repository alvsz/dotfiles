import Gio from "gi://Gio";
import GioUnix from "gi://GioUnix";
import GLib from "gi://GLib";
import NM from "gi://NM";
import Shell from "gi://Shell";

const VPN_UI_GROUP = "VPN Plugin UI";

class VPNRequestHandler extends Signals.EventEmitter {
  constructor(
    agent,
    requestId,
    authHelper,
    serviceType,
    connection,
    hints,
    flags,
  ) {
    super();

    this._agent = agent;
    this._requestId = requestId;
    this._connection = connection;
    this._flags = flags;
    this._pluginOutBuffer = [];
    this._title = null;
    this._description = null;
    this._content = [];
    this._shellDialog = null;

    let connectionSetting = connection.get_setting_connection();

    const argv = [
      authHelper.fileName,
      "-u",
      connectionSetting.uuid,
      "-n",
      connectionSetting.id,
      "-s",
      serviceType,
    ];
    if (authHelper.externalUIMode) argv.push("--external-ui-mode");
    if (flags & NM.SecretAgentGetSecretsFlags.ALLOW_INTERACTION)
      argv.push("-i");
    if (flags & NM.SecretAgentGetSecretsFlags.REQUEST_NEW) argv.push("-r");
    if (authHelper.supportsHints) {
      for (let i = 0; i < hints.length; i++) {
        argv.push("-t");
        argv.push(hints[i]);
      }
    }

    this._newStylePlugin = authHelper.externalUIMode;

    try {
      const launchContext = global.create_app_launch_context(0, -1);
      let [pid, stdin, stdout, stderr] = Shell.util_spawn_async_with_pipes(
        null /* pwd */,
        argv,
        launchContext.get_environment(),
        GLib.SpawnFlags.DO_NOT_REAP_CHILD,
      );

      this._childPid = pid;
      this._stdin = new GioUnix.OutputStream({ fd: stdin, close_fd: true });
      this._stdout = new GioUnix.InputStream({ fd: stdout, close_fd: true });
      GLib.close(stderr);
      this._dataStdout = new Gio.DataInputStream({ base_stream: this._stdout });

      if (this._newStylePlugin) this._readStdoutNewStyle();
      else this._readStdoutOldStyle();

      this._childWatch = GLib.child_watch_add(
        GLib.PRIORITY_DEFAULT,
        pid,
        this._vpnChildFinished.bind(this),
      );

      this._writeConnection();
    } catch (e) {
      logError(e, "error while spawning VPN auth helper");

      this._agent.respond(requestId, Shell.NetworkAgentResponse.INTERNAL_ERROR);
    }
  }

  cancel(respond) {
    if (respond)
      this._agent.respond(
        this._requestId,
        Shell.NetworkAgentResponse.USER_CANCELED,
      );

    if (this._newStylePlugin && this._shellDialog) {
      this._shellDialog.close();
      this._shellDialog.destroy();
    } else {
      try {
        this._stdin.write("QUIT\n\n", null);
      } catch (e) {
        /* ignore broken pipe errors */
      }
    }

    this.destroy();
  }

  destroy() {
    if (this._destroyed) return;

    this.emit("destroy");
    if (this._childWatch) GLib.source_remove(this._childWatch);

    this._stdin.close(null);
    // Stdout is closed when we finish reading from it

    this._destroyed = true;
  }

  _vpnChildFinished(pid, status, _requestObj) {
    this._childWatch = 0;
    if (this._newStylePlugin) {
      // For new style plugin, all work is done in the async reading functions
      // Just reap the process here
      return;
    }

    let [exited, exitStatus] = Shell.util_wifexited(status);

    if (exited) {
      if (exitStatus !== 0)
        this._agent.respond(
          this._requestId,
          Shell.NetworkAgentResponse.USER_CANCELED,
        );
      else
        this._agent.respond(
          this._requestId,
          Shell.NetworkAgentResponse.CONFIRMED,
        );
    } else {
      this._agent.respond(
        this._requestId,
        Shell.NetworkAgentResponse.INTERNAL_ERROR,
      );
    }

    this.destroy();
  }

  _vpnChildProcessLineOldStyle(line) {
    if (this._previousLine !== undefined) {
      // Two consecutive newlines mean that the child should be closed
      // (the actual newlines are eaten by Gio.DataInputStream)
      // Send a termination message
      if (line === "" && this._previousLine === "") {
        try {
          this._stdin.write("QUIT\n\n", null);
        } catch (e) {
          /* ignore broken pipe errors */
        }
      } else {
        this._agent.add_vpn_secret(this._requestId, this._previousLine, line);
        this._previousLine = undefined;
      }
    } else {
      this._previousLine = line;
    }
  }

  async _readStdoutOldStyle() {
    const [line, len_] = await this._dataStdout.read_line_async(
      GLib.PRIORITY_DEFAULT,
      null,
    );

    if (line === null) {
      // end of file
      this._stdout.close(null);
      return;
    }

    const decoder = new TextDecoder();
    this._vpnChildProcessLineOldStyle(decoder.decode(line));

    // try to read more!
    this._readStdoutOldStyle();
  }

  async _readStdoutNewStyle() {
    const cnt = await this._dataStdout.fill_async(
      -1,
      GLib.PRIORITY_DEFAULT,
      null,
    );

    if (cnt === 0) {
      // end of file
      this._showNewStyleDialog();

      this._stdout.close(null);
      return;
    }

    // Try to read more
    this._dataStdout.set_buffer_size(2 * this._dataStdout.get_buffer_size());
    this._readStdoutNewStyle();
  }

  _showNewStyleDialog() {
    let keyfile = new GLib.KeyFile();
    let data;
    let contentOverride;

    try {
      data = new GLib.Bytes(this._dataStdout.peek_buffer());
      keyfile.load_from_bytes(data, GLib.KeyFileFlags.NONE);

      if (keyfile.get_integer(VPN_UI_GROUP, "Version") !== 2)
        throw new Error("Invalid plugin keyfile version, is %d");

      contentOverride = {
        title: keyfile.get_string(VPN_UI_GROUP, "Title"),
        message: keyfile.get_string(VPN_UI_GROUP, "Description"),
        secrets: [],
      };

      let [groups, len_] = keyfile.get_groups();
      for (let i = 0; i < groups.length; i++) {
        if (groups[i] === VPN_UI_GROUP) continue;

        let value = keyfile.get_string(groups[i], "Value");
        let shouldAsk = keyfile.get_boolean(groups[i], "ShouldAsk");

        if (shouldAsk) {
          contentOverride.secrets.push({
            label: keyfile.get_string(groups[i], "Label"),
            key: groups[i],
            value,
            password: keyfile.get_boolean(groups[i], "IsSecret"),
          });
        } else {
          if (!value.length)
            // Ignore empty secrets
            continue;

          this._agent.add_vpn_secret(this._requestId, groups[i], value);
        }
      }
    } catch (e) {
      // No output is a valid case it means "both secrets are stored"
      if (data.length > 0) {
        logError(e, "error while reading VPN plugin output keyfile");

        this._agent.respond(
          this._requestId,
          Shell.NetworkAgentResponse.INTERNAL_ERROR,
        );
        this.destroy();
        return;
      }
    }

    if (contentOverride && contentOverride.secrets.length) {
      // Only show the dialog if we actually have something to ask
      this._shellDialog = new NetworkSecretDialog(
        this._agent,
        this._requestId,
        this._connection,
        "vpn",
        [],
        this._flags,
        contentOverride,
      );
      this._shellDialog.open();
    } else {
      this._agent.respond(
        this._requestId,
        Shell.NetworkAgentResponse.CONFIRMED,
      );
      this.destroy();
    }
  }

  _writeConnection() {
    let vpnSetting = this._connection.get_setting_vpn();

    try {
      vpnSetting.foreach_data_item((key, value) => {
        this._stdin.write(`DATA_KEY=${key}\n`, null);
        this._stdin.write(`DATA_VAL=${value || ""}\n\n`, null);
      });
      vpnSetting.foreach_secret((key, value) => {
        this._stdin.write(`SECRET_KEY=${key}\n`, null);
        this._stdin.write(`SECRET_VAL=${value || ""}\n\n`, null);
      });
      this._stdin.write("DONE\n\n", null);
    } catch (e) {
      logError(e, "internal error while writing connection to helper");

      this._agent.respond(
        this._requestId,
        Shell.NetworkAgentResponse.INTERNAL_ERROR,
      );
      this.destroy();
    }
  }
}

export default VPNRequestHandler;
