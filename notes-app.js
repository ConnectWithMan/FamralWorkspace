const notesList = document.getElementById('notes-list');
const noteTitle = document.getElementById('note-title');
const noteBody = document.getElementById('note-body');
const addBtn = document.getElementById('add-note-btn');
const searchInput = document.getElementById('search-notes');

const styleSelect = document.getElementById('select-style');
const fontSelect = document.getElementById('select-font');
const sizeSelect = document.getElementById('select-size');
const colorInput = document.getElementById('input-color');
const highlightInput = document.getElementById('input-highlight');
const linkBtn = document.getElementById('btn-link');
const unlinkBtn = document.getElementById('btn-unlink');
const imageBtn = document.getElementById('btn-image');
const imageInput = document.getElementById('image-input');
const resizeHandle = document.getElementById('resize-handle');

// State
let notes = JSON.parse(localStorage.getItem('onenote-clone-notes')) || [];
let activeNoteId = null;
let draggedNoteId = null;

// --- Functions ---

function saveNotes() {
    localStorage.setItem('onenote-clone-notes', JSON.stringify(notes));
}

function createNote() {
    const newNote = {
        id: Date.now(),
        title: '',
        content: '',
        updatedAt: new Date().toISOString()
    };
    
    notes.unshift(newNote); // Add to top
    saveNotes();
    setActiveNote(newNote.id);
}

function deleteNote(id, event) {
    event.stopPropagation(); // Prevent triggering the note selection
    
    const doDelete = confirm('Are you sure you want to delete this note?');
    if (!doDelete) return;

    notes = notes.filter(n => n.id !== id);
    saveNotes();

    if (notes.length === 0) {
        createNote();
    } else if (id === activeNoteId) {
        setActiveNote(notes[0].id);
    } else {
        renderNotesList();
    }
}

function setActiveNote(id) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);
    
    // Update UI inputs
    noteTitle.value = note.title;
    noteBody.innerHTML = note.content;
    
    renderNotesList();
}

function updateActiveNote() {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
        note.title = noteTitle.value;
        note.content = noteBody.innerHTML;
        note.updatedAt = new Date().toISOString();
        saveNotes();
        
        // Refresh list to show updated title
        renderNotesList(); 
    }
}

// --- Drag and Drop Handlers ---

function handleDragStart(e) {
    draggedNoteId = Number(this.dataset.id);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    // Only remove if leaving the element itself, not entering a child
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetId = Number(this.dataset.id);
    
    if (draggedNoteId !== null && draggedNoteId !== targetId) {
        const fromIndex = notes.findIndex(n => n.id === draggedNoteId);
        const toIndex = notes.findIndex(n => n.id === targetId);
        
        if (fromIndex > -1 && toIndex > -1) {
            const [movedNote] = notes.splice(fromIndex, 1);
            notes.splice(toIndex, 0, movedNote);
            saveNotes();
            renderNotesList();
        }
    }
}

function renderNotesList() {
    notesList.innerHTML = '';
    const searchQuery = searchInput.value.toLowerCase();
    
    const filteredNotes = notes.filter(note => 
        (note.title && note.title.toLowerCase().includes(searchQuery)) || 
        (note.content && note.content.toLowerCase().includes(searchQuery))
    );

    filteredNotes.forEach(note => {
        const div = document.createElement('div');
        div.classList.add('note-item');
        
        // Drag and Drop Attributes & Listeners
        div.setAttribute('draggable', 'true');
        div.dataset.id = note.id;
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('dragleave', handleDragLeave);
        div.addEventListener('drop', handleDrop);
        
        if (note.id === activeNoteId) {
            div.classList.add('active');
        }
        
        // Note Info Container
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('note-info');

        const displayTitle = note.title.trim() || 'Untitled Page';
        const dateStr = new Date(note.updatedAt || Date.now()).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        infoDiv.innerHTML = `
            <div class="note-title-preview">${displayTitle}</div>
            <div class="note-date">${dateStr}</div>
        `;
        
        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-note-btn');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => deleteNote(note.id, e));

        div.appendChild(infoDiv);
        div.appendChild(deleteBtn);
        
        div.addEventListener('click', () => setActiveNote(note.id));
        
        notesList.appendChild(div);
    });
}

// --- Event Listeners ---

addBtn.addEventListener('click', createNote);
searchInput.addEventListener('input', renderNotesList);

// Rich Text Formatting
const formatButtons = [
    { id: 'btn-bold', cmd: 'bold' },
    { id: 'btn-italic', cmd: 'italic' },
    { id: 'btn-underline', cmd: 'underline' },
    { id: 'btn-strikethrough', cmd: 'strikeThrough' },
    { id: 'btn-ul', cmd: 'insertUnorderedList' },
    { id: 'btn-ol', cmd: 'insertOrderedList' },
    { id: 'btn-left', cmd: 'justifyLeft' },
    { id: 'btn-center', cmd: 'justifyCenter' },
    { id: 'btn-right', cmd: 'justifyRight' },
    { id: 'btn-outdent', cmd: 'outdent' },
    { id: 'btn-indent', cmd: 'indent' }
];

formatButtons.forEach(btn => {
    document.getElementById(btn.id).addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent losing focus from editor
        document.execCommand(btn.cmd);
        updateActiveNote();
    });
});

styleSelect.addEventListener('change', () => {
    document.execCommand('formatBlock', false, styleSelect.value);
    updateActiveNote();
});

fontSelect.addEventListener('change', () => {
    document.execCommand('fontName', false, fontSelect.value);
    updateActiveNote();
});

sizeSelect.addEventListener('change', () => {
    document.execCommand('fontSize', false, sizeSelect.value);
    updateActiveNote();
});

colorInput.addEventListener('input', () => {
    document.execCommand('foreColor', false, colorInput.value);
    updateActiveNote();
});

highlightInput.addEventListener('input', () => {
    document.execCommand('hiliteColor', false, highlightInput.value);
    updateActiveNote();
});

linkBtn.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent losing focus
    let url = prompt('Enter the link URL:');
    if (url) {
        if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
            url = 'https://' + url;
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.isCollapsed) {
            document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${url}</a>`);
        } else {
            document.execCommand('createLink', false, url);
        }
        updateActiveNote();
    }
});

unlinkBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    document.execCommand('unlink');
    updateActiveNote();
});

imageBtn.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent losing focus from editor
});

imageBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.execCommand('insertImage', false, e.target.result);
            updateActiveNote();
        };
        reader.readAsDataURL(file);
    }
    this.value = ''; // Reset input
});

noteTitle.addEventListener('input', updateActiveNote);
noteBody.addEventListener('input', updateActiveNote);

// --- Image Resizing Logic ---
let selectedImage = null;
let isResizing = false;
let startX, startWidth, maxWidth;

function showResizeHandle() {
    if (!selectedImage || !noteBody.contains(selectedImage)) {
        hideResizeHandle();
        return;
    }
    selectedImage.classList.add('selected');

    const rect = selectedImage.getBoundingClientRect();
    
    resizeHandle.style.display = 'block';
    // Position at bottom-right of image
    resizeHandle.style.left = `${rect.right - 10}px`; 
    resizeHandle.style.top = `${rect.bottom - 10}px`;
}

function hideResizeHandle() {
    if (selectedImage) {
        selectedImage.classList.remove('selected');
    }
    selectedImage = null;
    resizeHandle.style.display = 'none';
}

noteBody.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
        window.open(link.href, '_blank');
    }

    if (e.target.tagName === 'IMG') {
        if (selectedImage && selectedImage !== e.target) {
            selectedImage.classList.remove('selected');
        }
        selectedImage = e.target;
        showResizeHandle();
    } else {
        hideResizeHandle();
    }
});

noteBody.addEventListener('dragstart', (e) => {
    // Prevent native dragging of images to avoid conflict with resizing
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

noteBody.addEventListener('scroll', () => {
    if (selectedImage) showResizeHandle();
});

resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    startX = e.clientX;
    startWidth = selectedImage.clientWidth;
    maxWidth = noteBody.clientWidth - 20; // Cache max width to avoid layout thrashing
    
    // UX: Change cursor globally and prevent selection
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing || !selectedImage) return;
    
    const deltaX = e.clientX - startX;
    let newWidth = startWidth + deltaX;
    
    // Constraints
    if (newWidth > maxWidth) newWidth = maxWidth;
    if (newWidth < 50) newWidth = 50;
    
    selectedImage.style.width = `${newWidth}px`;
    selectedImage.style.height = 'auto';
    showResizeHandle();
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        
        // Reset UX
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        updateActiveNote(); // Save new size
    }
});

window.addEventListener('resize', () => {
    if (selectedImage) showResizeHandle();
});

// --- Robustness Improvements ---

// Observer to handle layout changes (typing above image) or image deletion
const observer = new MutationObserver(() => {
    if (selectedImage) {
        if (!noteBody.contains(selectedImage)) {
            hideResizeHandle();
        } else {
            showResizeHandle();
        }
    }
});

observer.observe(noteBody, { 
    childList: true, 
    subtree: true, 
    characterData: true 
});

// Handle Delete key for selected image
document.addEventListener('keydown', (e) => {
    if (selectedImage && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Don't delete if user is typing in inputs (Title, Search, etc.)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        e.preventDefault();
        selectedImage.remove();
        hideResizeHandle();
        updateActiveNote();
    }
});

// Hide handle when focus moves to other inputs
noteTitle.addEventListener('focus', hideResizeHandle);
searchInput.addEventListener('focus', hideResizeHandle);

// --- Initialization ---

if (notes.length === 0) {
    createNote();
} else {
    setActiveNote(notes[0].id);
}
