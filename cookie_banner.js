/*
 * RealtyEGO — уведомление о cookie + Яндекс Метрика ТОЛЬКО после согласия (152-ФЗ).
 *  - По умолчанию код Метрики не загружается и cookie Метрики не ставятся.
 *  - «Принять»            -> choice = "all"       -> загружается Метрика (счётчик 113735863).
 *  - «Только необходимые» -> choice = "necessary" -> Метрика не загружается.
 *  - Выбор хранится в localStorage (ключ realtyego_cookie_consent) с датой и редакцией текста.
 *  - Элемент с атрибутом data-cookie-settings («Настройки cookie» в футере) снова открывает уведомление.
 *    Отказ после согласия удаляет cookie _ym* и перезагружает страницу, чтобы выгрузить счётчик.
 *  - Смена CONSENT_VERSION (новая редакция текста) снова показывает уведомление всем.
 *  - <noscript>-пиксель Метрики не используется: его нельзя поставить в зависимость от согласия.
 */
(function () {
  'use strict';

  var METRIKA_ID = 113735863;
  var CONSENT_VERSION = '2026-10-22';
  var STORAGE_KEY = 'realtyego_cookie_consent';
  var PRIVACY_URL = '/privacy/#cookies';
  var COOKIES_URL = '/cookies/';

  function readChoice() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== CONSENT_VERSION) return null;
      return data.choice === 'all' || data.choice === 'necessary' ? data.choice : null;
    } catch (e) { return null; }
  }
  function saveChoice(choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: CONSENT_VERSION, choice: choice, ts: new Date().toISOString() }));
    } catch (e) { /* приватный режим: выбор действует до закрытия страницы */ }
  }

  // Официальный код счётчика из кабинета Метрики, вызывается только после «Принять».
  var metrikaLoaded = false;
  function loadMetrika() {
    if (metrikaLoaded) return;
    metrikaLoaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID, 'ym');
    window.ym(METRIKA_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }
  function removeMetrikaCookies() {
    var names = document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); })
      .filter(function (n) { return n.indexOf('_ym') === 0; });
    var host = location.hostname;
    var domains = ['', host, '.' + host];
    names.forEach(function (n) {
      domains.forEach(function (d) {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
    try {
      Object.keys(window.localStorage).forEach(function (k) { if (k.indexOf('_ym') === 0) window.localStorage.removeItem(k); });
      Object.keys(window.sessionStorage).forEach(function (k) { if (k.indexOf('_ym') === 0) window.sessionStorage.removeItem(k); });
    } catch (e) {}
  }

  var banner;
  function buildBanner() {
    banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Настройки cookie');
    banner.hidden = true;
    banner.innerHTML =
      '<div class="cc-inner">' +
        '<p class="cc-text"><b>Сайт RealtyEGO использует cookie.</b> Необходимые нужны только, чтобы запомнить ваш выбор. ' +
        'Аналитические cookie сервиса Яндекс Метрика (ООО «ЯНДЕКС», данные в России), включая Вебвизор, включаются, только если вы нажмёте «Принять»: ' +
        'они помогают понять, какие страницы полезны. Подробнее в <a href="' + PRIVACY_URL + '">Политике конфиденциальности</a> ' +
        'и на странице <a href="' + COOKIES_URL + '">О файлах cookie</a>. Выбор можно изменить в любой момент по ссылке «Настройки cookie» внизу страницы.</p>' +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-btn" data-cc="all">Принять</button>' +
          '<button type="button" class="cc-btn" data-cc="necessary">Только необходимые</button>' +
        '</div>' +
      '</div>';
    banner.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-cc]');
      if (!btn) return;
      decide(btn.getAttribute('data-cc'));
    });
    document.body.appendChild(banner);
  }
  function show() { if (!banner) buildBanner(); banner.hidden = false; }
  function hide() { if (banner) banner.hidden = true; }

  function decide(choice) {
    var hadAnalytics = metrikaLoaded;
    saveChoice(choice);
    hide();
    if (choice === 'all') {
      loadMetrika();
    } else {
      removeMetrikaCookies();
      if (hadAnalytics) location.reload();
    }
  }

  function init() {
    var choice = readChoice();
    if (choice === 'all') loadMetrika();
    else if (choice === null) show();
    else removeMetrikaCookies();

    document.addEventListener('click', function (ev) {
      var el = ev.target.closest('[data-cookie-settings]');
      if (!el) return;
      ev.preventDefault();
      show();
    });
  }

  window.RealtyEGOCookies = { open: show, choice: readChoice };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
