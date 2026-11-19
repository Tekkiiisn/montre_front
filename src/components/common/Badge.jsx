export default function Badge({ type }) {
  if (!type) return null
  const styles = {
    nouveau: 'badge-nouveau',
    promo: 'badge-promo',
    rupture: 'badge-rupture',
  }
  const labels = { nouveau: 'Nouveau', promo: 'Promo', rupture: 'Rupture' }
  return <span className={styles[type]}>{labels[type]}</span>
}