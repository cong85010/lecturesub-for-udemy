(() => {
  const app = globalThis.CCUdemy ||= {};
  // Chrome documents these language codes; actual pair availability is checked on this device.
  app.LANGUAGES = Object.freeze([
    ['en', 'Tiếng Anh'], ['vi', 'Tiếng Việt'], ['ja', 'Tiếng Nhật'], ['ko', 'Tiếng Hàn'],
    ['zh', 'Tiếng Trung (giản thể)'], ['zh-Hant', 'Tiếng Trung (phồn thể)'],
    ['fr', 'Tiếng Pháp'], ['de', 'Tiếng Đức'], ['es', 'Tiếng Tây Ban Nha'], ['it', 'Tiếng Ý'],
    ['pt', 'Tiếng Bồ Đào Nha'], ['ru', 'Tiếng Nga'], ['th', 'Tiếng Thái'], ['id', 'Tiếng Indonesia'],
    ['ar', 'Tiếng Ả Rập'], ['bg', 'Tiếng Bulgaria'], ['bn', 'Tiếng Bengal'], ['cs', 'Tiếng Séc'],
    ['da', 'Tiếng Đan Mạch'], ['el', 'Tiếng Hy Lạp'], ['fi', 'Tiếng Phần Lan'], ['he', 'Tiếng Hebrew'],
    ['hi', 'Tiếng Hindi'], ['hr', 'Tiếng Croatia'], ['hu', 'Tiếng Hungary'], ['kn', 'Tiếng Kannada'],
    ['lt', 'Tiếng Lithuania'], ['mr', 'Tiếng Marathi'], ['nl', 'Tiếng Hà Lan'], ['no', 'Tiếng Na Uy'],
    ['pl', 'Tiếng Ba Lan'], ['ro', 'Tiếng Romania'], ['sk', 'Tiếng Slovakia'], ['sl', 'Tiếng Slovenia'],
    ['sv', 'Tiếng Thụy Điển'], ['ta', 'Tiếng Tamil'], ['te', 'Tiếng Telugu'], ['tr', 'Tiếng Thổ Nhĩ Kỳ'],
    ['uk', 'Tiếng Ukraina'],
  ]);
  app.languageName = code => app.LANGUAGES.find(item => item[0] === code)?.[1] || code;
})();
