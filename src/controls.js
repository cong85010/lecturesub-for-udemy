(() => {
  const app = globalThis.CCUdemy ||= {};
  app.SETTINGS_GROUPS = [
    { title: 'Ngôn ngữ', description: 'Ngôn ngữ nguồn cần trùng với lựa chọn trong menu CC của Udemy.', keys: ['enabled', 'sourceLanguage', 'targetLanguage', 'displayMode', 'reverseOrder'] },
    { title: 'Chữ & màu sắc', description: 'Chỉnh riêng bản gốc và bản dịch.', keys: ['sourceFontSize', 'targetFontSize', 'fontFamily', 'fontWeight', 'sourceColor', 'targetColor'] },
    { title: 'Nền & vị trí', description: 'Phụ đề tự co lại khi khung video nhỏ.', keys: ['backgroundColor', 'backgroundOpacity', 'lineHeight', 'lineGap', 'captionWidth', 'bottomOffset', 'textAlign'] },
    { title: 'Tra từ & điều khiển', description: 'Chọn cách video dừng và tiếp tục khi tra từ.', keys: ['pauseOnLookup', 'resumeOnClose', 'shortcutsEnabled'] },
  ];
  app.FIELDS = {
    enabled: { label: 'Bật phụ đề', type: 'checkbox' },
    sourceLanguage: { label: 'Ngôn ngữ nguồn', type: 'select', options: app.LANGUAGES },
    targetLanguage: { label: 'Ngôn ngữ dịch', type: 'select', options: app.LANGUAGES },
    displayMode: { label: 'Hiển thị', type: 'select', options: [['bilingual', 'Song ngữ'], ['source', 'Chỉ bản gốc'], ['translation', 'Chỉ bản dịch']] },
    reverseOrder: { label: 'Đưa bản dịch lên trước', type: 'checkbox' },
    sourceFontSize: { label: 'Cỡ chữ bản gốc', type: 'number', min: 14, max: 40, step: 1, unit: 'px' },
    targetFontSize: { label: 'Cỡ chữ bản dịch', type: 'number', min: 12, max: 40, step: 1, unit: 'px' },
    fontFamily: { label: 'Kiểu chữ', type: 'select', options: [['system', 'Hệ thống'], ['serif', 'Có chân'], ['mono', 'Đơn cách']] },
    fontWeight: { label: 'Độ đậm', type: 'select', numeric: true, options: [[400, 'Thường'], [500, 'Vừa'], [600, 'Đậm vừa'], [700, 'Đậm']] },
    sourceColor: { label: 'Màu bản gốc', type: 'color' }, targetColor: { label: 'Màu bản dịch', type: 'color' },
    backgroundColor: { label: 'Màu nền phụ đề', type: 'color' },
    backgroundOpacity: { label: 'Độ đậm nền', type: 'number', min: 0, max: 1, step: .05 },
    lineHeight: { label: 'Giãn dòng', type: 'number', min: 1.2, max: 2, step: .1 },
    lineGap: { label: 'Khoảng cách hai bản', type: 'number', min: 0, max: 20, step: 1, unit: 'px' },
    captionWidth: { label: 'Chiều rộng phụ đề', type: 'number', min: 50, max: 100, step: 1, unit: '%' },
    bottomOffset: { label: 'Khoảng cách tới đáy', type: 'number', min: 32, max: 240, step: 1, unit: 'px' },
    textAlign: { label: 'Căn chữ', type: 'select', options: [['left', 'Trái'], ['center', 'Giữa'], ['right', 'Phải']] },
    pauseOnLookup: { label: 'Tạm dừng khi tra từ', type: 'checkbox' },
    resumeOnClose: { label: 'Phát tiếp khi đóng tra từ', type: 'checkbox' },
    shortcutsEnabled: { label: 'Bật phím tắt Alt + Shift + C', type: 'checkbox' },
  };
  let sequence = 0;
  app.createControls = (container, keys, { change, preview = () => {} }) => {
    const controls = new Map();
    for (const key of keys) {
      const field = app.FIELDS[key], row = document.createElement('div'); row.className = 'field';
      row.dataset.setting = key;
      const label = document.createElement('label'); label.textContent = field.label;
      if (key === 'displayMode') {
        label.id = `cc-label-${++sequence}`;
        const group = document.createElement('div'); group.className = 'segmented';
        group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-labelledby', label.id);
        const choices = field.options.map(([value, title], index) => {
          const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'radio');
          button.textContent = ({ bilingual: 'Song ngữ', source: 'Bản gốc', translation: 'Bản dịch' })[value] || title; button.dataset.value = value;
          button.addEventListener('click', () => change({ [key]: value }));
          button.addEventListener('keydown', event => {
            const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % 3
              : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + 2) % 3
                : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1;
            if (next < 0) return;
            event.preventDefault(); choices[next].focus(); change({ [key]: choices[next].dataset.value });
          });
          group.append(button); return button;
        });
        row.classList.add('segmented-field'); row.append(label, group); container.append(row);
        controls.set(key, { update(settings) { choices.forEach(button => {
          const selected = button.dataset.value === settings[key]; button.setAttribute('aria-checked', String(selected)); button.tabIndex = selected ? 0 : -1;
        }); } });
        continue;
      }
      const input = document.createElement(field.type === 'select' ? 'select' : 'input');
      input.id = `cc-field-${++sequence}`; input.name = key; label.htmlFor = input.id;
      if (field.type === 'select') {
        for (const [value, title] of field.options) { const option = document.createElement('option'); option.value = value; option.textContent = title; input.append(option); }
      } else { input.type = field.type; if (field.type === 'checkbox') input.setAttribute('role', 'switch'); }
      const values = document.createElement('div'); values.className = 'field-value';
      if (field.type === 'number') {
        input.min = field.min; input.max = field.max; input.step = field.step;
        const range = document.createElement('input'); range.type = 'range'; range.min = field.min; range.max = field.max; range.step = field.step;
        range.setAttribute('aria-label', `${field.label} — thanh trượt`);
        range.addEventListener('input', () => { input.value = range.value; range.style.setProperty('--range-percent', `${(range.value - field.min) / (field.max - field.min) * 100}%`); preview({ [key]: Number(range.value) }); });
        range.addEventListener('change', () => change({ [key]: Number(range.value) }));
        values.append(range); controls.set(`${key}:range`, range);
      }
      values.append(input);
      if (field.type === 'color') {
        row.classList.add('color-field');
        const swatches = document.createElement('div'); swatches.className = 'swatches';
        for (const [color, name] of [['#ffffff', 'trắng'], ['#171916', 'đen'], ['#a1a59e', 'xám'], ['#f0df4a', 'vàng'], ['#a9ccfa', 'xanh nhạt']]) {
          const swatch = document.createElement('button'); swatch.type = 'button'; swatch.className = 'swatch';
          swatch.style.backgroundColor = color; swatch.dataset.color = color;
          swatch.setAttribute('aria-label', `${field.label}: ${name}`); swatch.title = name;
          swatch.addEventListener('click', () => change({ [key]: color })); swatches.append(swatch);
        }
        values.prepend(swatches);
        controls.set(`${key}:swatches`, { update(settings) { swatches.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === settings[key]))); } });
      }
      if (field.unit) { const unit = document.createElement('span'); unit.className = 'unit'; unit.textContent = field.unit; values.append(unit); }
      const value = () => field.type === 'checkbox' ? input.checked : field.type === 'number' || field.numeric ? Number(input.value) : input.value;
      input.addEventListener('input', () => preview({ [key]: value() }));
      input.addEventListener('change', () => { if (field.type === 'number' && !input.value.trim()) return; change({ [key]: value() }); });
      row.append(label, values); container.append(row); controls.set(key, input);
    }
    return { update(settings) {
      for (const [key, input] of controls) {
        if (typeof input.update === 'function') { input.update(settings); continue; }
        const name = key.replace(':range', '');
        if (input.type === 'checkbox') input.checked = settings[name]; else input.value = settings[name];
        if (input.tagName === 'SELECT') input.title = input.selectedOptions[0]?.textContent || '';
        if (input.type === 'range') input.style.setProperty('--range-percent', `${(settings[name] - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
      }
    } };
  };
  app.downloadFile = (filename, content, type) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
})();
