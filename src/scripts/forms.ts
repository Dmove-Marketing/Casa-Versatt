export function buildFonte(tracking?: Record<string, string>): string {
  const path = (typeof window !== 'undefined' ? window.location.pathname : '') || tracking?.landing_page || '';
  const cleanPath = path.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const segment = cleanPath.split('/').pop()?.replace(/\.html$/, '') || '';
  const pageName = (!segment || segment === 'index') ? 'eventos-corporativos' : segment;
  const base = `Landing page/${pageName}`;

  const search = (typeof window !== 'undefined' ? window.location.search : '').replace(/^\?/, '');
  if (search) return `${base} - ${search}`;

  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid', 'msclkid', 'sck'];
  const params = new URLSearchParams();
  trackingKeys.forEach((key) => {
    const value = tracking?.[key];
    if (value) params.set(key, value);
  });
  const qs = params.toString();

  return qs ? `${base} - ${qs}` : base;
}


function validateForm(form: HTMLFormElement): boolean {
  let valid = true;

  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    '[required]'
  ).forEach((field) => {
    const empty = !field.value.trim();
    const isEmail = (field as HTMLInputElement).type === 'email';
    const emailInvalid = isEmail && !empty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    const group = field.closest<HTMLElement>('.form-group, [class$="-form-group"]');

    if (empty || emailInvalid) {
      valid = false;
      field.classList.add('field-invalid');
      if (group && !group.querySelector('.field-error-msg')) {
        const msg = document.createElement('span');
        msg.className = 'field-error field-error-msg visible';
        msg.textContent = empty ? 'Campo obrigatório' : 'Digite um e-mail válido';
        group.appendChild(msg);
      } else if (group) {
        const existing = group.querySelector('.field-error-msg');
        if (existing) existing.textContent = empty ? 'Campo obrigatório' : 'Digite um e-mail válido';
      }
    } else {
      field.classList.remove('field-invalid');
      group?.querySelector('.field-error-msg')?.remove();
    }

    if (!field.dataset.validationInit) {
      field.dataset.validationInit = '1';
      const clear = () => {
        field.classList.remove('field-invalid');
        field.closest<HTMLElement>('.form-group, [class$="-form-group"]')
          ?.querySelector('.field-error-msg')?.remove();
      };
      field.addEventListener('input', clear);
      field.addEventListener('change', clear);
    }
  });

  if (!valid) {
    const first = form.querySelector<HTMLElement>('.field-invalid');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first?.focus();
  }

  return valid;
}

export function initForms() {
  const forms = document.querySelectorAll<HTMLFormElement>('form[data-form-id]');
  forms.forEach((form) => {
    if (form.dataset.formInitialized) return;
    form.dataset.formInitialized = '1';
    let started = false;
    const formId    = form.dataset.formId!;
    const project   = form.dataset.project || window.location.hostname;
    const apiUrl    = form.dataset.apiUrl ?? '';
    const submitUrl = form.dataset.submitUrl || (apiUrl ? `${apiUrl}/submit` : null);
    const redirectUrl = form.dataset.redirect;
    const gridId    = form.dataset.gridId;
    const successId = form.dataset.successId;

    if (!submitUrl) {
      console.warn(`[Forms] Formulário ${formId} sem URL de webhook (data-submit-url).`);
      return;
    }

    form.addEventListener('focusin', () => {
      if (!started) {
        started = true;
        (window as any).dataLayer?.push({ event: 'form_start', form_id: formId, project });
      }
    });

    async function handleSubmit() {
      const hp = form.querySelector<HTMLInputElement>('[name="website"]');
      if (hp && hp.value) return;

      if (!validateForm(form)) return;

      const submitBtn  = form.querySelector<HTMLButtonElement>('.form-submit');
      const btnText    = submitBtn?.querySelector<HTMLElement>('.btn-text');
      const btnLoading = submitBtn?.querySelector<HTMLElement>('.btn-loading');
      const msgEl = gridId
        ? document.getElementById(gridId)?.querySelector('[id$="FormMsg"]') as HTMLElement | null
        : form.querySelector('.form-error') as HTMLElement | null;

      if (submitBtn) submitBtn.disabled = true;
      if (btnText && btnLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
      } else if (submitBtn && !submitBtn.querySelector('.btn-loading')) {
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enviando...';
      }
      if (msgEl) msgEl.style.display = 'none';

      const formData = new FormData(form);
      const data: Record<string, string> = {};
      formData.forEach((v, k) => { if (k !== 'website') data[k] = v.toString(); });

      const trackingRaw = sessionStorage.getItem('dmove_tracking');
      const tracking    = trackingRaw ? JSON.parse(trackingRaw) : {};

      const now = new Date();
      const dateFmt = now.toLocaleDateString('pt-BR');
      const timeFmt = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

      const payload: Record<string, string> = {
        ...data,
        ...tracking,
        'Fonte': buildFonte(tracking),
        'Data': dateFmt,
        'Horário': timeFmt,
        'URL da página': window.location.href,
        'Agente de usuário': navigator.userAgent,
        'Desenvolvido por': 'Dmove',
        'form_id': formId,
        'form_name': formId,
      };

      try {
        const res = await fetch(submitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('http_' + res.status);

        let json: any = {};
        try { json = await res.json(); } catch {}

        (window as any).dataLayer?.push({ event: 'form_submit', form_id: formId, project, ...data });

        const redir = redirectUrl || json.redirect;
        if (redir) { window.location.href = redir; return; }

        const gridEl    = gridId    ? document.getElementById(gridId)    : null;
        const successEl = successId ? document.getElementById(successId) : null;
        if (gridEl && successEl) {
          gridEl.style.display = 'none';
          successEl.classList.add('active');
        } else {
          form.innerHTML = `<div style="text-align:center;padding:2rem"><div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;background:#2563eb;border-radius:50%;color:white;font-size:1.5rem">✓</div><h3 style="font-size:1.15rem;font-weight:600;margin-bottom:4px">Enviado com sucesso!</h3><p style="color:#666;font-size:0.9rem">Em breve entraremos em contato.</p></div>`;
        }
      } catch (err: any) {
        (window as any).dataLayer?.push({ event: 'form_error', form_id: formId, error: err.message });
        if (msgEl) {
          msgEl.innerHTML = 'Erro ao enviar. Tente novamente mais tarde.';
          msgEl.style.display = 'block';
        } else {
          alert('Erro ao enviar o formulário. Tente novamente mais tarde.');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText && btnLoading) {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
          } else if (submitBtn.dataset.originalText) {
            submitBtn.innerHTML = submitBtn.dataset.originalText;
          }
        }
      }
    }

    const submitBtn = form.querySelector<HTMLButtonElement>('.form-submit');
    submitBtn?.addEventListener('click', handleSubmit);

    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
      e.preventDefault();
      handleSubmit();
    });
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
}
