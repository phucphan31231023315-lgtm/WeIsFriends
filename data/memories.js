const baseMemories = [
  {
    id: 1,
    image: '/memories/upload-01.jpg',
    title: 'Night Out',
    caption: 'Chilling with friends at a cozy night cafe.',
    year: '2024',
    glowColor: '#ffbb00',
    position: [-2.5, 0.5, -8],
  },
  {
    id: 2,
    image: '/memories/upload-02.jpg',
    title: 'Peace & Coffee',
    caption: 'Capturing moments under the tropical leaves.',
    year: '2024',
    glowColor: '#00ffaa',
    position: [2.5, 0.2, -16],
  },
  {
    id: 3,
    image: '/memories/upload-03.jpg',
    title: 'Bánh Căn',
    caption: 'The warm glow of charcoal cooking traditional Vietnamese mini pancakes.',
    year: '2024',
    glowColor: '#ff5500',
    position: [-2.2, 0.8, -24],
  },
  {
    id: 4,
    image: '/memories/upload-04.jpg',
    title: 'Lakeside Calm',
    caption: 'A peaceful horse resting under the pine tree by the lake.',
    year: '2024',
    glowColor: '#33ccff',
    position: [2.2, 0.4, -32],
  },
  {
    id: 5,
    image: '/memories/upload-05.jpg',
    title: 'Airstream Vibes',
    caption: 'Enjoying the sunshine and good coffee at the Airdream truck.',
    year: '2024',
    glowColor: '#ff0055',
    position: [-2.4, 0.3, -40],
  }
];

export const places = [
  {
    id: 'dalat',
    name: 'Đà Lạt',
    prefix: '01',
    bgMusic: '/audio/dalat.mp3',
    tagline: 'Sương mờ phố núi',
    description: 'Một đêm lạnh, vài món ăn nóng, và những người bạn khiến chuyến đi trở nên đáng nhớ hơn.',
    memories: baseMemories.map(m => ({ ...m, id: `dalat-${m.id}` }))
  },
  {
    id: 'vungtau',
    name: 'Vũng Tàu',
    prefix: '02',
    bgMusic: '/audio/vungtau.mp3',
    tagline: 'Sóng biển rì rào',
    description: 'Hương vị gió biển mặn mòi, bờ cát trải dài và tiếng sóng vỗ dịu êm vỗ về những ký ức ngọt ngào.',
    memories: []
  },
  {
    id: 'hatien',
    name: 'Hà Tiên',
    prefix: '03',
    bgMusic: '/audio/hatien.mp3',
    tagline: 'Hoàng hôn xứ biển',
    description: 'Nơi biên thùy lặng gió, hoàng hôn nhuộm đỏ rực chân trời mang lại cảm giác bình yên đến lạ thường.',
    memories: []
  },
  {
    id: 'caolanh',
    name: 'Cao Lãnh',
    prefix: '04',
    bgMusic: '/audio/caolanh.mp3',
    tagline: 'Đất sen hồng thanh bình',
    description: 'Vùng đất trù phú miền Tây sông nước với những cánh đồng sen bát ngát và tình người ấm áp chan chứa.',
    memories: []
  },
  {
    id: 'thapcam',
    name: 'Thập Cẩm',
    prefix: '05',
    bgMusic: '/audio/thapcam.mp3',
    tagline: 'Hành trình trải nghiệm',
    description: 'Tuyển tập những khoảnh khắc đáng giá, lưu giữ kỷ niệm từ những cung đường tuyệt đẹp dọc đất nước.',
    memories: []
  }
];
