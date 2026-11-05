import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CameraOff, Flag, MapPin } from 'lucide-react';
import { positionOnContainedImage, positionOnCoveredImage } from '../services/photoArrows';
import './GuidedRouteView.css';

function DirectionIcon({ direction, size = 29 }) {
  if (direction === 'IZQUIERDA') return <ArrowLeft size={size} />;
  if (direction === 'DERECHA') return <ArrowRight size={size} />;
  if (direction === 'ATRAS' || direction === 'BAJAR') return <ArrowDown size={size} />;
  return <ArrowUp size={size} />;
}

export default function GuidedRouteView({ destination, steps, stepIndex, onStepChange, onArrowSelect, onClose }) {
  const [failedPhoto, setFailedPhoto] = useState('');
  const [photoSize, setPhotoSize] = useState(null);
  const [frameSize, setFrameSize] = useState(null);
  const [travel, setTravel] = useState(null);
  const photoFrameRef = useRef(null);
  const travelTimer = useRef(null);
  const moving = useRef(false);
  const step = steps[stepIndex];
  const photo = step?.photo?.imagen && failedPhoto !== step.photo.imagen ? step.photo : null;
  const photoKey = photo ? `${step.id}-${photo.imagen}` : null;
  const photoReady = photoSize?.key === photoKey;
  useEffect(() => {
    const frame = photoFrameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [photo?.imagen]);
  useEffect(() => {
    const nextPhoto = steps[stepIndex + 1]?.photo?.imagen;
    if (nextPhoto) {
      const image = new Image();
      image.src = nextPhoto;
    }
  }, [steps, stepIndex]);
  useEffect(() => () => window.clearTimeout(travelTimer.current), []);
  useEffect(() => {
    if (travel?.phase !== 'waiting' || step?.id === travel.fromId) return undefined;
    const reveal = () => setTravel((current) => current?.phase === 'waiting' ? { ...current, phase: 'revealing' } : current);
    if (!photo || photoReady) { reveal(); return undefined; }
    const timer = window.setTimeout(reveal, 1800);
    return () => window.clearTimeout(timer);
  }, [travel, step?.id, photo, photoReady]);
  useEffect(() => {
    if (travel?.phase !== 'revealing') return undefined;
    const timer = window.setTimeout(() => { setTravel(null); moving.current = false; }, 340);
    return () => window.clearTimeout(timer);
  }, [travel?.phase]);
  if (!step) return null;

  const isLast = stepIndex === steps.length - 1;
  const useContainedImage = Boolean(photoReady && frameSize && (step.arrows || []).some((arrow) => {
    const point = positionOnCoveredImage(arrow.posicion_x, arrow.posicion_y, photoSize, frameSize);
    return !point || point.left < 32 || point.left > frameSize.width - 32 || point.top < 32 || point.top > frameSize.height - 32;
  }));
  const arrows = (step.arrows || []).map((arrow) => ({
    ...arrow,
    point: photoReady
      ? (useContainedImage ? positionOnContainedImage : positionOnCoveredImage)(arrow.posicion_x, arrow.posicion_y, photoSize, frameSize)
      : null,
  })).filter((arrow) => arrow.point);
  const photoLoading = Boolean(photo && !photoReady);
  const showFallback = !isLast && !photoLoading && arrows.length === 0;
  const nextPoint = arrows.find((arrow) => arrow.recommended)?.targetName;
  const nextReference = steps[stepIndex + 1]?.reference || 'Siguiente punto';
  const moveTo = (action, direction = 'ADELANTE', point = null) => {
    if (moving.current) return;
    if (!photo || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { action(); return; }
    moving.current = true;
    setTravel({ phase: 'leaving', fromId: step.id, photo: photo.imagen, direction, point, contained: useContainedImage });
    travelTimer.current = window.setTimeout(() => {
      setTravel((current) => current ? { ...current, phase: 'waiting' } : current);
      action();
    }, 250);
  };
  const travelMotion = travel?.direction === 'IZQUIERDA' ? { x: '7%', y: '0%', scale: '1.1' }
    : travel?.direction === 'DERECHA' ? { x: '-7%', y: '0%', scale: '1.1' }
      : ['ATRAS', 'BAJAR'].includes(travel?.direction) ? { x: '0%', y: '5%', scale: '.96' }
        : { x: '0%', y: '-5%', scale: '1.12' };

  return <main className="guided-route-screen">
    <section className={`guided-route-scene${photo ? ' has-photo' : ''}${travel ? ' is-traveling' : ''}`} aria-label={`Referencia visual de ${step.reference || step.title}`}>
      {photo
        ? <div className={`guided-route-photo-frame${useContainedImage ? ' is-contained' : ''}`} ref={photoFrameRef}><img key={`backdrop-${photoKey}`} className={`guided-route-photo-backdrop${photoReady ? ' is-ready' : ''}`} src={photo.imagen} alt="" aria-hidden="true" /><img key={`main-${photoKey}`} className={`guided-route-photo-main${photoReady ? ' is-ready' : ''}`} src={photo.imagen} alt={`Vista de ${step.reference || step.title}`} onLoad={(event) => setPhotoSize({ key: photoKey, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => setFailedPhoto(photo.imagen)} /></div>
        : <div className="guided-route-no-photo"><CameraOff size={35} /><strong>Sin fotografía de este punto</strong><span>Usa la indicación escrita y comprueba las señales del campus.</span></div>}
      <div className="guided-route-scene-shade" aria-hidden="true" />
      {travel && <div className={`guided-route-travel-overlay${travel.phase === 'revealing' ? ' is-revealing' : ''}${travel.contained ? ' is-contained' : ''}`} aria-hidden="true" style={{ '--travel-x': travelMotion.x, '--travel-y': travelMotion.y, '--travel-scale': travelMotion.scale, '--travel-origin': travel.point ? `${travel.point.left}px ${travel.point.top}px` : 'center center' }}><img src={travel.photo} alt="" /></div>}
      {photo && arrows.length > 0 && <div key={`arrows-${photoKey}`} className="guided-route-hotspots" aria-label="Flechas para explorar el recorrido">
        {arrows.map((arrow) => <button key={arrow.id} type="button" className={`guided-route-hotspot${arrow.recommended ? ' is-recommended' : ''}`} style={{ left: arrow.point.left, top: arrow.point.top }} onClick={() => moveTo(() => onArrowSelect?.(arrow), arrow.direccion, arrow.point)} disabled={Boolean(travel)} aria-label={arrow.etiqueta || `Ir a ${arrow.targetName || 'otro punto'}`} title={arrow.etiqueta || arrow.targetName}><DirectionIcon direction={arrow.direccion} size={25} /></button>)}
      </div>}

      <header className="guided-route-header">
        <button onClick={onClose} aria-label="Cerrar guía y volver al resumen"><ArrowLeft size={22} /></button>
        <div><span>DESTINO</span><strong>{destination}</strong></div>
        <span className="guided-route-counter" aria-label={`Paso ${stepIndex + 1} de ${steps.length}`}>{stepIndex + 1}<small>/{steps.length}</small></span>
      </header>

      <div className="guided-route-scene-bottom">
        <div className="guided-route-location"><MapPin size={16} /><span>{step.reference || step.title}</span></div>
        {showFallback && <button className="guided-route-photo-arrow" type="button" onClick={() => moveTo(() => onStepChange(stepIndex + 1), step.direction)} disabled={Boolean(travel)} aria-label={`Continuar a ${nextReference} sin flecha registrada`}>Continuar</button>}
      </div>
    </section>

    <footer className="guided-route-footer" aria-live="polite">
      <div className="guided-route-footer-summary">
        <span className={`guided-route-summary-icon${isLast ? ' is-destination' : ''}`}>{isLast ? <Flag size={22} /> : <DirectionIcon direction={step.direction} size={23} />}</span>
        <div><small>{isLast ? 'RECORRIDO COMPLETADO' : photoLoading ? 'CARGANDO FOTO' : arrows.length ? 'SIGUIENTE PUNTO' : 'FLECHA PENDIENTE'}</small><strong>{isLast ? 'Llegaste a tu destino' : arrows.length ? nextPoint || 'Elige una flecha' : nextReference}</strong></div>
      </div>
      {showFallback && <p className="guided-route-fallback">{step.instruction}</p>}
      {isLast && <button className="guided-route-finish" type="button" onClick={onClose}>Terminar</button>}
    </footer>
  </main>;
}
