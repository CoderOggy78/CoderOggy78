// App script for animations, UI, and Firebase contact form

// --- Utils ---
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// --- Header: mobile nav toggle ---
const hamburger = $('#hamburger');
const siteNav = $('#siteNav');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    const isOpen = hamburger.classList.contains('active');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    siteNav.classList.toggle('open', isOpen);
  });
}

// --- Year in footer ---
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- AOS init ---
AOS.init({ duration: 700, once: true, easing: 'ease-out-quart' });

// --- GSAP Hero text animation ---
const heroTitle = $('.hero-title');
if (heroTitle) {
  const lines = $$('.title-line', heroTitle);
  gsap.set(lines, { y: 40, opacity: 0 });
  gsap.to(lines, { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: 'power3.out', delay: 0.2 });
}

// --- Animate skill bars on scroll ---
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const skill = entry.target;
      const percent = Number(skill.getAttribute('data-percent')) || 0;
      const bar = $('.bar .value', skill);
      if (!bar) continue;
      gsap.to(bar, { width: `${percent}%`, duration: 1.2, ease: 'power2.out' });
      observer.unobserve(skill);
    }
  }
}, { threshold: 0.4 });
$$('.skill').forEach((el) => observer.observe(el));

// --- Projects modal ---
const modal = $('#projectModal');
const modalTitle = $('#modalTitle');
const modalDesc = $('#modalDesc');
const modalTech = $('#modalTech');
const modalLink = $('#modalLink');

function openModal({ title, description, tech, url }) {
  modalTitle.textContent = title || '';
  modalDesc.textContent = description || '';
  modalTech.textContent = tech || '';
  modalLink.href = url || '#';
  modal.setAttribute('aria-hidden', 'false');
  gsap.fromTo($('.modal-dialog', modal), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' });
}
function closeModal() {
  gsap.to($('.modal-dialog', modal), { y: 12, opacity: 0, duration: 0.2, ease: 'power1.in', onComplete: () => {
    modal.setAttribute('aria-hidden', 'true');
  }});
}

$$('.project-card').forEach((card) => {
  card.addEventListener('click', () => {
    openModal({
      title: card.getAttribute('data-title'),
      description: card.getAttribute('data-description'),
      tech: card.getAttribute('data-tech'),
      url: card.getAttribute('data-url'),
    });
  });
});

modal?.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-close')) closeModal();
});

// --- Smooth scroll for in-page anchors ---
$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (siteNav.classList.contains('open')) {
      hamburger?.classList.remove('active');
      siteNav.classList.remove('open');
    }
  });
});

// --- Firebase (modular) setup ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// Fill these before deploy (see README)
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.info('[Firebase] Initialized');
} catch (err) {
  console.warn('[Firebase] Config missing or invalid. Firestore features disabled until configured.', err);
}

// Optional cloud function URL. If left null, app will write directly to Firestore.
const SUBMIT_FUNCTION_URL = null; // e.g., `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/submitContact`

// --- Contact form submission ---
const contactForm = $('#contactForm');
const formStatus = $('#formStatus');

function setStatus(msg, type = 'info') {
  if (!formStatus) return;
  formStatus.textContent = msg;
  formStatus.style.color = type === 'error' ? '#ff7b7b' : type === 'success' ? '#7bffcf' : '#9bb3d1';
}

async function submitViaFunction(payload) {
  if (!SUBMIT_FUNCTION_URL) throw new Error('No function URL');
  const res = await fetch(SUBMIT_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Function request failed');
  return await res.json();
}

async function submitViaFirestore(payload) {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = await addDoc(collection(db, 'contactMessages'), { ...payload, createdAt: serverTimestamp() });
  return { id: docRef.id };
}

contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(contactForm);
  const payload = {
    name: (formData.get('name') || '').toString().trim(),
    email: (formData.get('email') || '').toString().trim(),
    message: (formData.get('message') || '').toString().trim(),
  };

  if (!payload.name || !payload.email || !payload.message) {
    setStatus('Please fill all fields.', 'error');
    return;
  }

  setStatus('Sending…');

  try {
    if (SUBMIT_FUNCTION_URL) {
      await submitViaFunction(payload);
    } else {
      await submitViaFirestore(payload);
    }
    setStatus('Thanks! Your message has been sent.', 'success');
    contactForm.reset();
  } catch (err) {
    console.error(err);
    setStatus('Something went wrong. Please try again later.', 'error');
  }
});
