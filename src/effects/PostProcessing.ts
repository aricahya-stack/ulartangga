/**
 * Visual finishing for the HTML/canvas container.
 * Kept engine-independent so it remains stable across WebGL2/WebGPU paths.
 */
export function enableCinematicFrame(container: HTMLElement) {
  container.classList.add('cinematic-frame');
}
