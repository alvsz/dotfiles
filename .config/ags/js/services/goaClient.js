import Goa from "gi://Goa";

const makeAccounts = (accounts) => {
  let contas = [];

  for (let account of accounts) {
    const icons = account.account.provider_icon.split(" ");

    let conta = {
      obj: account,
      id: account.account.id,
      name: account.account.identity,
      type: account.account.provider_type,
      icon: {
        symbolic: icons[5],
        normal: icons[3],
        fallback: icons[4],
      },
      auth: {},
      mail: { active: false },
      calendar: { active: false },
    };

    if (account.password_based) {
      conta.auth.type = "password";

      try {
        conta.auth.password = account.password_based.call_get_password_sync(
          conta.id,
          null,
        );
      } catch (error) {
        print(error);

        conta.auth.password = [false, ""];
      }
    } else if (account.oauth2_based) {
      conta.auth.type = "oauth2";

      try {
        conta.auth.oauth2 =
          account.oauth2_based.call_get_access_token_sync(null);
      } catch (error) {
        print(error);

        conta.auth.oauth2 = [false, "", 0];
      }
    } else if (account.oauth_based) {
      conta.auth.type = "oauth";

      try {
        conta.auth.oauth = account.oauth_based.call_get_access_token_sync();
      } catch (error) {
        print(error);

        conta.auth.oauth = [false, "", "", 0];
      }
    }

    if (account.mail) {
      const mail = account.get_mail();

      conta.mail = {
        active: true,
        address: mail.email_address,
        name: mail.name,
        imap: {
          host: mail.imap_host,
          supported: mail.imap_supported,
          ssl: mail.imap_use_ssl,
          tls: mail.imap_use_tls,
          username: mail.imap_user_name,
          accept_ssl_errors: mail.imap_accept_ssl_errors,
        },
        smtp: {
          accept_ssl_errors: mail.smtp_accept_ssl_errors,
          auth_login: mail.smtp_auth_login,
          auth_plain: mail.smtp_auth_plain,
          auth_xoauth2: mail.smtp_auth_xoauth2,
          host: mail.smtp_host,
          supported: mail.smtp_supported,
          use_auth: mail.smtp_use_auth,
          ssl: mail.smtp_use_ssl,
          tls: mail.smtp_use_tls,
          username: mail.smtp_user_name,
        },
      };
      conta.mail.active = true;

      conta.mail.address = mail.email_address;
    }
    if (account.calendar) {
      const calendar = account.get_calendar();

      conta.calendar = {
        active: true,
        uri: calendar.uri,
        accept_ssl_errors: calendar.accept_ssl_errors,
      };
    }
    contas.push(conta);
  }

  return contas;
};

export default () => {
  const client = Goa.Client.new_sync(null);
  const accounts = client.get_accounts();

  const contas = makeAccounts(accounts);
  return contas;
};
