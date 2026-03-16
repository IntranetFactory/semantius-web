/** Hide the HTML loading overlay from index.html */
export function hideAppLoader() {
  document.getElementById('app-loader')?.setAttribute('hidden', '')
}
