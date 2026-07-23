// Custom Searchable Dropdown Component with Icons
export function initSearchableDropdown({ container, options, placeholder, value, onChange, icon }) {
  if (!container) return;

  let selectedOption = options.find(o => o.value === value) || (value ? { label: value, value: value } : null);

  container.innerHTML = `
    <div class="custom-select-wrapper">
      <div class="custom-select-trigger">
        <div class="select-content">
          ${icon ? `<i data-lucide="${icon}"></i>` : ''}
          <span class="selected-text">${selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <i data-lucide="chevron-down" class="chevron-icon"></i>
      </div>
      <div class="select-dropdown">
        <div class="select-search">
          <input type="text" placeholder="Search..." />
        </div>
        <div class="select-options"></div>
      </div>
    </div>
  `;

  const wrapper = container.querySelector('.custom-select-wrapper');
  const trigger = container.querySelector('.custom-select-trigger');
  const searchInput = container.querySelector('.select-search input');
  const optionsContainer = container.querySelector('.select-options');
  const selectedText = container.querySelector('.selected-text');

  function renderOptions(filterText = '') {
    const filtered = options.filter(opt => opt.label.toLowerCase().includes(filterText.toLowerCase()));
    
    optionsContainer.innerHTML = filtered.map(opt => `
      <div class="select-option ${selectedOption?.value === opt.value ? 'selected' : ''}" data-value="${opt.value}">
        ${opt.icon ? `<i data-lucide="${opt.icon}"></i>` : ''}
        <span>${opt.label}</span>
      </div>
    `).join('');

    // Re-bind Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Bind option click
    optionsContainer.querySelectorAll('.select-option').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = el.getAttribute('data-value');
        const match = options.find(o => o.value === val);
        selectedOption = match;
        selectedText.textContent = match.label;
        wrapper.classList.remove('open');
        if (onChange) onChange(val);
      });
    });
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
      if (w !== wrapper) w.classList.remove('open');
    });
    wrapper.classList.toggle('open');
    if (wrapper.classList.contains('open')) {
      searchInput.focus();
      renderOptions('');
    }
  });

  searchInput.addEventListener('input', (e) => {
    renderOptions(e.target.value);
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
    }
  });

  renderOptions('');
}
