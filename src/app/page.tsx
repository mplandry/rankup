{
  [
    {
      init: "ML",
      name: "M. Landry",
      role: "Waltham Fire Dept",
      text: "This used the exact same Mass reading list material I needed to study for my exam. Finally a prep tool built around what we actually get tested on.",
    },
    {
      init: "JT",
      name: "J. Thompson",
      role: "Firefighter, preparing for Captain",
      text: "The flashcard spaced repetition is a game changer. I studied on my phone between shifts and the material actually stuck.",
    },
    {
      init: "DK",
      name: "D. Kowalski",
      role: "Promoted to Captain",
      text: "Best exam prep resource for MA firefighters. The Mass General Laws section alone is worth it.",
    },
  ].map(({ init, name, role, text }) => (
    <div key={name} className='testimonial'>
      <div className='stars'>★★★★★</div>
      <p className='testimonial-text'>{text}</p>
      <div className='testimonial-author'>
        <div className='author-avatar'>{init}</div>
        <div>
          <div className='author-name'>{name}</div>
          <div className='author-title'>{role}</div>
        </div>
      </div>
    </div>
  ));
}
