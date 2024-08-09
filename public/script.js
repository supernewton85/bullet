const colors = ['#e0f7fa', '#ffecb3', '#c8e6c9', '#d1c4e9', '#ffe0b2', '#f8bbd0'];
let currentCardToDelete = null;
let currentCardPassword = null;
let postAttempts = {};
const adminPassword = 'chltjddnr1!';
const forbiddenWords = [
    "욕설1", "욕설2", "욕설3", // 실제 단어로 대체해야 합니다.
    "욕설4", "욕설5", "욕설6",
    "욕설7", "욕설8", "욕설9",
    "욕설10", "욕설11", "욕설12"
];

// 서버로부터 게시물 불러오기
async function fetchPosts() {
    try {
        const response = await fetch('http://localhost:3000/posts');
        const posts = await response.json();
        posts.forEach(post => {
            addPostToBoard(post);
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
    }
}

document.getElementById('addButton1').addEventListener('click', function() {
    openModal(1);
});

document.getElementById('addButton2').addEventListener('click', function() {
    openModal(2);
});

function openModal(boardId) {
    const deleteTimeSelect = document.getElementById('deleteTime');
    deleteTimeSelect.innerHTML = '';

    const times = boardId === 1 ? [60000, 180000, 300000, 600000] : [1800000, 3600000, 10800000, 21600000];
    times.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.text = `${time / 60000} minutes`;
        deleteTimeSelect.appendChild(option);
    });

    document.getElementById('modal').dataset.boardId = boardId;
    document.getElementById('modal').style.display = 'block';
}

document.getElementById('saveButton').addEventListener('click', savePost);

async function savePost() {
    console.log("Save button clicked");
    const content = document.getElementById('postContent').value;
    const author = document.getElementById('author').value;
    const postPassword = document.getElementById('postPassword').value;
    const deleteTime = parseInt(document.getElementById('deleteTime').value);
    const timestamp = new Date().toLocaleTimeString();
    const boardId = document.getElementById('modal').dataset.boardId;

    console.log("Content:", content);
    console.log("Author:", author);
    console.log("Password:", postPassword);
    console.log("Delete Time:", deleteTime);
    console.log("Timestamp:", timestamp);
    console.log("Board ID:", boardId);

    if (content.length > 0 && author.length > 0) {
        const post = {
            author,
            password: postPassword,
            content,
            timestamp,
            deleteTime,
            boardId
        };

        try {
            const response = await fetch('http://localhost:3000/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(post)
            });
            const savedPost = await response.json();
            console.log("Saved post:", savedPost);
            addPostToBoard(savedPost);
            document.getElementById('modal').style.display = 'none';
            document.getElementById('postContent').value = '';
            document.getElementById('author').value = '';
            document.getElementById('postPassword').value = '';
        } catch (error) {
            console.error("Error saving post:", error);
        }
    }
}

function addPostToBoard(post) {
    const cardContainer = document.getElementById(`cardContainer${post.boardId}`);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    const contentElem = document.createElement('div');
    contentElem.className = 'content';
    contentElem.innerText = post.content;

    const authorElem = document.createElement('div');
    authorElem.className = 'author';
    authorElem.innerText = `By: ${post.author}`;

    const timestampElem = document.createElement('div');
    timestampElem.className = 'timestamp';
    timestampElem.innerText = `Posted on: ${post.timestamp}`;

    const expandButton = document.createElement('button');
    expandButton.className = 'expandButton';
    expandButton.innerText = '+';
    expandButton.addEventListener('click', function() {
        card.classList.toggle('expanded');
        card.style.width = card.classList.contains('expanded') ? '300px' : '120px';
        card.style.height = card.classList.contains('expanded') ? '300px' : '120px';
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteButton';
    deleteButton.innerText = 'x';
    deleteButton.addEventListener('click', function() {
        currentCardToDelete = card;
        currentCardPassword = post.password;
        document.getElementById('passwordModal').style.display = 'block';
    });

    card.dataset.password = post.password;
    card.dataset.id = post.id;

    card.appendChild(contentElem);
    card.appendChild(authorElem);
    card.appendChild(timestampElem);
    card.appendChild(expandButton);
    card.appendChild(deleteButton);
    cardContainer.appendChild(card);

    // 일정 시간 뒤에 글 삭제
    setTimeout(async function() {
        if (card.parentElement) {
            cardContainer.removeChild(card);
            await fetch(`http://localhost:3000/posts/${post.id}`, {
                method: 'DELETE'
            });
        }
    }, post.deleteTime);
}

function containsForbiddenWords(text) {
    return forbiddenWords.some(word => text.includes(word));
}

document.getElementById('deleteConfirmButton').addEventListener('click', async function() {
    const password = document.getElementById('password').value;
    if (password === adminPassword || password === currentCardPassword || currentCardPassword === '') {
        if (currentCardToDelete) {
            currentCardToDelete.parentElement.removeChild(currentCardToDelete);
            await fetch(`http://localhost:3000/posts/${currentCardToDelete.dataset.id}`, {
                method: 'DELETE'
            });
            currentCardToDelete = null;
            currentCardPassword = null;
        }
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('password').value = '';
    } else {
        alert('Incorrect password!');
    }
});

// 모달 외부 클릭 시 닫기
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    } else if (event.target === document.getElementById('passwordModal')) {
        document.getElementById('passwordModal').style.display = 'none';
    }
});

// ESC 키를 눌러 모달 닫기
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.getElementById('modal').style.display = 'none';
    }
});

// Ctrl+Enter로 저장
window.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        if (document.getElementById('modal').style.display === 'block') {
            savePost();
        }
    }
});

// 초기화
fetchPosts();
