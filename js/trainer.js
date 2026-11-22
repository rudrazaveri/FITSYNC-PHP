/**
 * FitSync AI — Dedicated Trainer Portal JavaScript
 *
 * Implements mobile sidebar drawer, roster search/filtering,
 * member dossier tab switching, and coaching note recording.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Navigation Toggle (Identical to User Portal)
  const mobileToggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('sidebarNav');
  const overlay = document.getElementById('sidebarOverlay');

  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // 2. Member Roster Search & Filter (Members Page)
  const memberSearchInput = document.getElementById('memberSearchInput');
  const goalFilterSelect = document.getElementById('goalFilterSelect');
  const memberCards = document.querySelectorAll('.member-item');

  function filterMembers() {
    const query = (memberSearchInput ? memberSearchInput.value.toLowerCase().trim() : '');
    const goal = (goalFilterSelect ? goalFilterSelect.value : '');

    memberCards.forEach(card => {
      const name = card.getAttribute('data-name') || '';
      const email = card.getAttribute('data-email') || '';
      const cardGoal = card.getAttribute('data-goal') || '';

      const matchesSearch = !query || name.includes(query) || email.includes(query);
      const matchesGoal = !goal || cardGoal === goal;

      if (matchesSearch && matchesGoal) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (memberSearchInput) {
    memberSearchInput.addEventListener('input', filterMembers);
  }
  if (goalFilterSelect) {
    goalFilterSelect.addEventListener('change', filterMembers);
  }

  // 3. Member Details Dossier Tab Switcher
  const tabButtons = document.querySelectorAll('.fs-tab-btn');
  const tabPanes = document.querySelectorAll('.fs-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById('tab-' + targetTab);
      if (targetPane) {
        targetPane.classList.add('active');
      }

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  });

  // 4. Record Coach Note Form Submission
  const noteForm = document.getElementById('coachNoteForm');
  if (noteForm) {
    noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = noteForm.querySelector('button[type="submit"]');
      const noteInput = document.getElementById('noteTextInput');
      const noteType = document.getElementById('noteTypeSelect');
      const memberId = noteForm.getAttribute('data-member-id');

      if (!noteInput || !noteInput.value.trim()) return;

      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Save';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving...';
      }

      try {
        const formData = new FormData();
        formData.append('member_id', memberId);
        formData.append('note_type', noteType ? noteType.value : 'general');
        formData.append('note_text', noteInput.value.trim());

        const res = await fetch('api/trainer/notes.php', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          // Prepend new note to the feed
          const feed = document.getElementById('notesFeedContainer');
          if (feed) {
            const emptyNotice = feed.querySelector('.empty-notes-notice');
            if (emptyNotice) emptyNotice.remove();

            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            noteDiv.innerHTML = `
              <div class="note-meta">
                <span class="fs-badge fs-badge-blue">${escapeHtml(data.note.note_type || 'General')}</span>
                <span>Just now</span>
              </div>
              <div class="note-body">${escapeHtml(data.note.note_text)}</div>
            `;
            feed.prepend(noteDiv);
          }
          noteInput.value = '';
          alert('Note saved successfully!');
        } else {
          alert(data.message || 'Failed to save note.');
        }
      } catch (err) {
        console.error('Error saving note:', err);
        alert('An error occurred while saving the note.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Initial Lucide icons rendering
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
