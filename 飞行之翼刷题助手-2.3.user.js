// ==UserScript==
// @name         飞之翼刷题助手
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  快捷键操作+自动保存题目到Obsidian
// @author       palenoadv
// @match        *://*.feizhiyi.com/*
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        keyBindings: {
            'q': 'li[data-index="A"]',
            'w': 'li[data-index="B"]',
            'e': 'li[data-index="C"]',
            'r': 'openCommentsAndSort',
            'escape': 'closeAllModals',
            'd': '#next',
            'a': '#prev',
            'z': 'saveToObsidian',
            's': 'enlargeImage'
        },
        obsidian: {
            vaultName: "markdowns",
            fileName: "私商仪复习.md",
            template: "**{question}**\n{tags}\n\n{options}\n\n> 💬 **精选评论**:\n> {comment}\n\n---\n",
            mode: "append",
            defaultTag: "#未分类"
        },
        ignoredTags: ['input', 'textarea', 'select'],
        maxRetries: 3,
        delaySteps: {
            openComments: 800,
            switchToHot: 500,
            getComment: 300
        }
    };

    function init() {
        document.addEventListener('keydown', handleKeyPress);
        cleanStaleImages();
        console.log('飞之翼助手已加载，按 z 保存题目到Obsidian');
    }

    function cleanStaleImages() {
        const imageContainer = document.querySelector('#title-img');
        if (imageContainer && imageContainer.style.display === 'none') {
            imageContainer.innerHTML = '';
        }
    }

    function handleKeyPress(e) {
        const tag = document.activeElement.tagName.toLowerCase();
        if (config.ignoredTags.includes(tag)) return;

        const key = e.key.toLowerCase();
        const action = config.keyBindings[key];
        if (!action) return;

        if (action === 'saveToObsidian') {
            handleSaveToObsidian();
        } else if (action === 'openCommentsAndSort') {
            document.querySelector('#do-note')?.click();
            setTimeout(() => {
                switchToHotSort();
            }, config.delaySteps.openComments);
        } else if (action === 'enlargeImage') {
            const img = document.querySelector('#title-img img');
            if (img) {
                img.click();
            }
        } else if (action === 'closeAllModals') {
            document.querySelector('.layui-layer-iframe')?.remove();
            document.querySelector('.layui-layer-shade')?.remove();
            document.querySelector('.layui-layer-close2')?.click();
        } else {
            document.querySelector(action)?.click();
        }
    }

    function handleSaveToObsidian() {
        const questionText = getQuestionText();
        const questionImages = getQuestionImagesMarkdown();
        const question = questionImages ? `${questionText}\n\n${questionImages}` : questionText;
        const options = getOptions();
        const tags = getCurrentTag();
        const comment = getBestComment();

        saveToObsidian(question, options, comment, tags);
        copyToClipboard(question, options, comment, tags);
    }

    function getCurrentTag() {
        const tagElement = document.querySelector('li[unselectable="on"][style*="user-select: none"]');
        if (!tagElement) return config.obsidian.defaultTag;

        const rawText = tagElement.innerText
            .replace('正在学习：', '')
            .trim()
            .replace(/>/g, '/')
            .replace(/\s+/g, '_');

        return `#${rawText}`;
    }

    function switchToHotSort() {
        return new Promise((resolve, reject) => {
            let retries = 0;
            const trySwitch = () => {
                try {
                    const iframe = document.querySelector('iframe[src*="makeNoteShow"]');
                    const doc = iframe?.contentDocument || document;
                    const hotestTab = doc.querySelector('#hotest');
                    if (hotestTab && !hotestTab.classList.contains('active')) {
                        hotestTab.click();
                        resolve();
                    } else if (retries < config.maxRetries) {
                        retries++;
                        setTimeout(trySwitch, config.delaySteps.switchToHot);
                    } else {
                        resolve();
                    }
                } catch (e) {
                    if (retries < config.maxRetries) {
                        retries++;
                        setTimeout(trySwitch, config.delaySteps.switchToHot);
                    } else {
                        reject(e);
                    }
                }
            };
            trySwitch();
        });
    }

    function getQuestionText() {
        return document.querySelector('#subject-title p.content')?.innerText.trim() || '【题干提取失败】';
    }

    function getQuestionImages() {
        return Array.from(document.querySelectorAll('#title-img img'))
            .filter(img => img.offsetParent !== null)
            .map(img => img.src)
            .filter(Boolean);
    }

    function getQuestionImagesMarkdown() {
        const imgs = getQuestionImages();
        return imgs.map(url => `![](${url})`).join('\n');
    }

    function getOptions() {
        return Array.from(document.querySelectorAll('li.option')).map(li => {
            const index = li.getAttribute('data-index');
            const content = li.querySelector('p.content')?.innerText.trim() || '';
            const isCorrect = li.getAttribute('data-value') === 'true';
            return `- ${index}. ${content}${isCorrect ? ' ✅' : ''}`;
        });
    }

    function getBestComment() {
        try {
            const iframe = document.querySelector('iframe[src*="makeNoteShow"]');
            const doc = iframe?.contentDocument || document;
            const firstComment = doc.querySelector('.others-note-scroll .ohers-note-show, .ohers-note-show');
            return firstComment?.querySelector('.showText')?.innerText.trim() || '';
        } catch (e) {
            console.error('获取评论出错:', e);
            return '';
        }
    }

    function saveToObsidian(question, options, comment, tags = '') {
        const content = config.obsidian.template
            .replace('{question}', question)
            .replace('{options}', options.join('\n'))
            .replace('{comment}', comment || '无精选评论')
            .replace('{tags}', tags || config.obsidian.defaultTag);

        const encodedVault = encodeURIComponent(config.obsidian.vaultName);
        const encodedFile = encodeURIComponent(config.obsidian.fileName);
        const encodedContent = encodeURIComponent(content);

        const uri = `obsidian://advanced-uri?vault=${encodedVault}&filepath=${encodedFile}&data=${encodedContent}&mode=append`;

        try {
            window.open(uri);
            showNotification('内容已发送到Obsidian');
        } catch (e) {
            console.error('打开 Obsidian URI 失败:', e);
            showNotification('⚠️ 无法打开 Obsidian，请检查是否已安装并启用 URI 支持');
        }
    }

    function copyToClipboard(question, options, comment, tags = '') {
        const markdown = `**${question}**\n${tags || config.obsidian.defaultTag}\n\n${options.join('\n')}${
            comment ? `\n\n> 💬 **精选评论**:\n> ${comment}` : ''
        }\n\n---`;

        navigator.clipboard.writeText(markdown).catch(err => {
            console.error("复制失败:", err);
            showNotification('⚠️ 复制失败，请手动复制');
        });
    }

    function showNotification(message) {
        if (typeof GM_notification !== 'undefined') {
            GM_notification({ title: '飞之翼助手', text: message, timeout: 2 });
        } else {
            alert(message);
        }
    }

    window.addEventListener('load', init);
})();
