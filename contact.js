// お問い合わせフォーム: バックエンドを持たない静的サイトのため、入力内容から
// mailto: リンクを組み立て、利用者のメールソフトを起動して送信する方式。
(function () {
  "use strict";

  // 送信先メールアドレス
  var CONTACT_EMAIL = "masaru120888@gmail.com";

  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (!form) return;

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = val("cf-name");
    var email = val("cf-email");
    var subject = val("cf-subject");
    var body = val("cf-body");

    if (!name || !subject || !body) {
      if (status) status.textContent = "お名前・件名・お問い合わせ内容は必須項目です。";
      return;
    }

    var mailSubject = "[Threat Viewer] " + subject;
    var mailBody = [
      body,
      "",
      "――――――――――――――――――――",
      "お名前: " + name,
      "返信先メールアドレス: " + (email || "（未記入）"),
    ].join("\n");

    var href =
      "mailto:" +
      CONTACT_EMAIL +
      "?subject=" +
      encodeURIComponent(mailSubject) +
      "&body=" +
      encodeURIComponent(mailBody);

    window.location.href = href;

    if (status) {
      status.textContent =
        "メールソフトを起動しました。起動しない場合は、お手数ですが " +
        CONTACT_EMAIL +
        " 宛に直接お送りください。";
    }
  });
})();
