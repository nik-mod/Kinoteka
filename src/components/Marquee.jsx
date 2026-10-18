const BASE_ITEMS = ['ახლა კინოთეკაში', 'EST. 2024', 'პირადი კინოარქივი', '35MM · DIGITAL · ARCHIVE']

function sequence(genres) {
  const items = [...BASE_ITEMS]
  genres.slice(0, 6).forEach((genre, index) => {
    items.splice(1 + index * 2, 0, genre)
  })
  return items
}

export default function Marquee({ genres = [] }) {
  const items = sequence(genres)
  const strip = (hidden) => <div className="marquee-track" aria-hidden={hidden || undefined}>
    {items.map((item, index) => <span className="marquee-item" key={index}>
      <span className={index % 3 === 0 ? 'is-brass' : undefined}>{item}</span>
      <span className="marquee-sep" />
    </span>)}
  </div>

  return <div className="marquee" data-cursor>
    {strip(false)}
    {strip(true)}
  </div>
}
