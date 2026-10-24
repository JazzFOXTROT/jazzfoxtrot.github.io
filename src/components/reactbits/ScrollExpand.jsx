'use client';

import { useCallback, useEffect, useRef } from 'react';

import './ScrollExpand.css';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

const ScrollExpand = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 42,
  startHeight = 58,
  startLeft,
  startTop,
  mediaColor = '#000',
  stageChildren = null,
  onProgress,
  stayOpen = false, // portfolio extension: once fully opened, it stays open
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}) => {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const mediaRef = useRef(null);
  const titleRef = useRef(null);
  const overlayRef = useRef(null);
  const scrimRef = useRef(null);
  const hintRef = useRef(null);

  const propsRef = useRef({});
  propsRef.current = {
    startWidth,
    startHeight,
    startLeft,
    startTop,
    onProgress,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
    stayOpen
  };

  const applyProgress = useCallback(p => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const e = smoothstep(0, 1, p);

    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    // Portfolio extension: optional off-centre start (startLeft / startTop, in %).
    const l0 = c.startLeft ?? (100 - c.startWidth) / 2;
    const t0 = c.startTop ?? (100 - c.startHeight) / 2;
    const il = Math.max(0, l0 * (1 - e));
    const it = Math.max(0, t0 * (1 - e));
    const ir = Math.max(0, 100 - il - w);
    const ib = Math.max(0, 100 - it - h);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${it}% ${ir}% ${ib}% ${il}% round ${r}px)`;
    if (c.onProgress) c.onProgress(p, e);

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimRef.current) scrimRef.current.style.opacity = `${c.overlayScrim * e}`;

    if (titleRef.current) {
      const out = smoothstep(0.4, 0.88, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlayRef.current) {
      const inn = smoothstep(0.68, 1, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;
    let opened = false;
    let openRaf = 0;
    let collapsed = false; // stayOpen: after the first full pass, the pinned scroll length is removed

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = collapsed
        ? `${stageH}px`
        : `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 20, 84)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled || opened) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        const v = clamp(-top / span, 0, 1);
        if (c.stayOpen && v >= 0.999) opened = true;
        return v;
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      // Once it has opened and the reader has scrolled past it, drop the extra pinned length.
      // The removed height is above the viewport, so compensating the scroll makes it invisible.
      if (opened && !collapsed && propsRef.current.useWindowScroll && track.getBoundingClientRect().bottom <= 0) {
        // Browsers' scroll anchoring would also "fix" the jump, and the two corrections added up
        // (the page jumped back into "Me"). Switch anchoring off for this one change and set the
        // exact position ourselves.
        const html = document.documentElement;
        const prevAnchor = html.style.overflowAnchor;
        html.style.overflowAnchor = 'none';
        const y = window.scrollY;
        const before = track.offsetHeight;
        collapsed = true;
        measure();
        const want = y - (before - track.offsetHeight);
        window.scrollTo(0, want);
        requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - want) > 200) window.scrollTo(0, want);
          html.style.overflowAnchor = prevAnchor;
        });
      }
      if (openRaf) return; // the self-playing open is in charge
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    // Portfolio extension: open without scrolling (the "About me" link).
    // Dispatch `new Event('se:open')` on the root; it plays the expansion on its own and
    // keeps it open, with the pinned scroll length removed (it sits below the viewport here).
    const onOpen = () => {
      if (opened && current >= 0.999) return;
      opened = true;
      collapsed = true;
      measure();
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      const from = current;
      const dur = reduceMotion ? 0 : 1100;
      const t0 = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      const step = now => {
        const t = dur ? Math.min(1, (now - t0) / dur) : 1;
        current = target = from + (1 - from) * ease(t);
        applyProgress(current);
        openRaf = t < 1 ? requestAnimationFrame(step) : 0;
      };
      openRaf = requestAnimationFrame(step);
    };
    root.addEventListener('se:open', onOpen);

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (openRaf) cancelAnimationFrame(openRaf);
      root.removeEventListener('se:open', onOpen);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll]);

  const media =
    mediaType === 'color' ? (
      <div ref={mediaRef} className="scroll-expand__media" style={{ background: mediaColor }} />
    ) : mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img ref={mediaRef} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
    );

  return (
    <div
      ref={rootRef}
      className={`scroll-expand ${useWindowScroll ? '' : 'scroll-expand--scroller'} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            ) : null}
          </div>
          {title ? (
            <div ref={titleRef} className="scroll-expand__title">
              {title}
            </div>
          ) : null}
          {stageChildren}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
