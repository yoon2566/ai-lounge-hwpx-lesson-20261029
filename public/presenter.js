/* 발표 기능만 담당합니다. 문구와 장 순서는 index.html, 서식은 styles.css입니다. */
(() => {
  'use strict';
  const slides = Array.from(document.querySelectorAll('.slide'));
  const frame = document.querySelector('#slide-frame');
  const viewport = document.querySelector('#viewport');
  const page = document.querySelector('#page');
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  const fullscreen = document.querySelector('#fullscreen');
  const status = document.querySelector('#status');
  let current = 0;

  // HTML의 실제 문구를 복사합니다. 버튼 문구·번호는 복사하지 않습니다.
  document.querySelectorAll('.prompt').forEach(prompt => {
    const heading = prompt.querySelector('h3');
    const text = prompt.querySelector('p');
    if (!heading || !text) return;
    const header = document.createElement('div');
    header.className = 'prompt-heading';
    heading.before(header);
    header.append(heading);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-prompt';
    button.textContent = '요청문 복사';
    const pageNumber = slides.indexOf(prompt.closest('.slide')) + 1;
    button.setAttribute('aria-label', `${pageNumber}쪽 예시 프롬프트 복사`);
    header.append(button);
    let resetTimer;
    button.addEventListener('click', async () => {
      const value = text.innerText.trim();
      let copied = false;
      button.disabled = true;
      try {
        if (navigator.clipboard?.writeText) {
          try { await navigator.clipboard.writeText(value); copied = true; }
          catch { /* 로컬 파일·권한 제한 환경에서는 아래 방법으로 재시도합니다. */ }
        }
        if (!copied) {
          const helper = document.createElement('textarea');
          helper.value = value;
          helper.setAttribute('aria-label', '프롬프트 복사용 임시 입력란');
          helper.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;';
          document.body.append(helper);
          try { helper.select(); copied = document.execCommand('copy'); }
          finally { helper.remove(); button.focus({ preventScroll: true }); }
        }
        if (copied) {
          button.textContent = '복사됨';
          status.textContent = '프롬프트를 복사했습니다. 사용할 입력창에 붙여넣으세요.';
        } else {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(text);
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = '직접 복사';
          status.textContent = '자동 복사가 제한됩니다. 선택된 문장을 Ctrl+C로 복사하세요.';
        }
      } finally {
        button.disabled = false;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { button.textContent = '요청문 복사'; }, 2500);
      }
    });
  });

  slides.forEach((slide, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = String(i + 1);
    page.append(option);
    slide.setAttribute('aria-label', `${i + 1} / ${slides.length}`);
  });

  function resize() {
    const availableWidth = Math.max(1, viewport.clientWidth - 48);
    const availableHeight = Math.max(1, viewport.clientHeight - 24);
    const scale = Math.min(availableWidth / 1600, availableHeight / 900);
    frame.style.setProperty('--slide-scale', String(scale));
  }

  function show(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    page.value = String(current);
    document.querySelector('#page-count').textContent = `/ ${slides.length}`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    status.textContent = '';
    document.title = `${current + 1}/${slides.length} · ${slides[current].querySelector('h1, h2').innerText.replace(/\s+/g, ' ')}`;
    if (updateHash) history.replaceState(null, '', `#${current + 1}`);
  }

  function fromHash() {
    const number = Number(location.hash.slice(1));
    show(Number.isInteger(number) && number > 0 ? number - 1 : 0, false);
  }

  async function toggleFullscreen() {
    status.textContent = '';
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else status.textContent = '이 브라우저에서는 전체화면을 사용할 수 없습니다.';
    } catch {
      status.textContent = '전체화면을 사용할 수 없습니다. 브라우저의 전체화면 기능을 이용해 주세요.';
    }
  }

  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  page.addEventListener('change', () => show(Number(page.value)));
  fullscreen.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    fullscreen.textContent = document.fullscreenElement ? '전체화면 종료' : '전체화면';
    resize();
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); show(current + 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); show(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); show(0); }
    else if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  });
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(viewport);
  window.addEventListener('hashchange', fromHash);
  fromHash();
  resize();
})();
