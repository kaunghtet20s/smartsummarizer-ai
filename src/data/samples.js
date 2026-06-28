// One-click demo content per mode, so the app (and every tool) is instantly
// testable without hunting for input. Keyed by mode id.

export const SAMPLES = {
  youtube: `[00:00] Hey everyone, welcome back to the channel. Today we're breaking down how to actually build a habit that sticks, based on the science.
[00:42] The first big idea is to make it obvious. Most habits fail because the cue is hidden. So put your running shoes by the door, keep the book on your pillow.
[02:15] The second principle is to make it small. Don't commit to an hour at the gym — commit to two minutes. Two minutes is so easy you can't say no, and it gets you in the door.
[04:30] Third, make it satisfying. Our brains repeat what feels good immediately, so track your streak and give yourself a tiny reward right after.
[06:10] And finally, never miss twice. Missing one day is an accident; missing two is the start of a worse habit. Just show up the next day.
[07:55] Do these four things consistently for a month and you'll be shocked at the results. Thanks for watching, see you in the next one.`,

  document: `Quarterly Operations Report — Q2

Overview: This report summarizes operational performance for the second quarter. Overall output increased 14% versus Q1, driven by improvements on the assembly line and reduced supplier delays.

Key Findings: Average production cycle time fell from 9.2 to 7.8 days. Defect rates dropped to 1.1%, below the 1.5% target. Energy costs, however, rose 6% due to higher utility rates.

Challenges: Two of four facilities reported staffing shortages during peak weeks, pushing overtime spend above budget. The new inventory system suffered three outages totaling eleven hours.

Recommendations: Hire two additional line supervisors before Q3, negotiate a fixed-rate energy contract, and add redundancy to the inventory system.

Conclusion: The quarter delivered strong gains in efficiency and quality, but rising costs and staffing gaps must be addressed to sustain momentum into the second half of the year.`,

  article: `Why Cities Should Rethink Parking

For decades, urban planners treated abundant parking as a public good, mandating minimum spaces for every new building. A growing body of evidence suggests those rules have quietly made cities more expensive, more congested, and less livable.

The core problem is that mandated parking is rarely free to build. A single structured space can cost tens of thousands of dollars, and those costs get baked into rents whether or not a tenant owns a car. In effect, people without cars subsidize those who drive.

Cities that relaxed parking minimums, from Buffalo to Minneapolis, saw developers build more housing and more diverse neighborhoods. Freed from wrapping every project around a garage, builders added units, shops, and green space instead.

Critics worry fewer spaces will flood streets with cars hunting for spots. Yet smart pricing of curb parking, paired with better transit, has eased that pressure where tried. The lesson is not that parking is evil, but that letting the market decide how much to build tends to produce better cities than blanket mandates ever did.`,

  review: `Review 1: Bought these headphones last month — the sound is incredible, deep bass and crisp highs. Battery easily lasts a full workday. Only downside is they feel a bit tight after a few hours.

Review 2: Great noise cancellation for the price, but the app is buggy and disconnects randomly. Customer support was slow to respond.

Review 3: Comfortable and lightweight, love them for the gym. However, mine started crackling in the left ear after three weeks, which is disappointing.

Review 4: Solid build quality and the case is compact. Mic quality on calls is just okay — people say I sound distant. Still, good value overall.

Review 5: Returned them. The pairing kept dropping and the volume was lower than my old pair. Maybe I got a defective unit.`,

  grammar: `Me and my team has been working on this project since three weeks, and we is almost done. Their are still a few bug to fix, but overall the results looks very promising. We hope to launching it next monday if everything go smooth.`,

  paraphrase: `Remote work has fundamentally changed how companies operate. Many employees now enjoy greater flexibility and report higher job satisfaction, while businesses save money on office space. At the same time, maintaining team culture and clear communication has become harder without face-to-face interaction.`,

  humanize: `In today's fast-paced digital landscape, leveraging cutting-edge solutions is paramount for organizations seeking to optimize operational efficiency. By harnessing the power of innovative technologies, businesses can unlock unprecedented value, drive sustainable growth, and deliver exceptional outcomes that resonate with key stakeholders across diverse market segments.`,

  aicheck: `Furthermore, it is important to note that the implementation of robust strategies plays a crucial role in achieving optimal results. By carefully considering various factors and leveraging best practices, individuals and organizations alike can ensure successful outcomes. Ultimately, a comprehensive approach that encompasses multiple dimensions is essential for long-term success and sustainability.`,
};

export const getSample = (modeId) => SAMPLES[modeId] || '';
