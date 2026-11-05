/* Interactive application logic for Google Gemini landing page */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Console Prompt Presets
  const prompts = {
    code: {
      prompt: 'Write an async token bucket rate limiter in Python',
      rate: '128 tok/s',
      latency: '184ms',
      output: `<span class="kw">import</span> asyncio
<span class="kw">import</span> time

<span class="kw">class</span> <span class="fn">TokenBucket</span>:
    <span class="kw">def</span> <span class="fn">__init__</span>(self, capacity: <span class="fn">float</span>, fill_rate: <span class="fn">float</span>):
        self.capacity = capacity
        self.fill_rate = fill_rate
        self.tokens = capacity
        self.updated_at = time.monotonic()
        self._lock = asyncio.Lock()

    <span class="kw">async def</span> <span class="fn">consume</span>(self, tokens: <span class="fn">float</span> = 1.0) -&gt; <span class="fn">bool</span>:
        <span class="kw">async with</span> self._lock:
            now = time.monotonic()
            elapsed = now - self.updated_at
            self.tokens = min(self.capacity, self.tokens + elapsed * self.fill_rate)
            self.updated_at = now
            <span class="kw">if</span> self.tokens &gt;= tokens:
                self.tokens -= tokens
                <span class="kw">return True</span>
            <span class="kw">return False</span>`
    },
    vision: {
      prompt: 'Extract topological data flow and identify circular dependencies from schematic',
      rate: '142 tok/s',
      latency: '210ms',
      output: `<span class="cm"># Multimodal Vision Analysis: 4 Nodes Detected</span>
<span class="fn">Topology</span>:
  Node_A (Ingress API) -&gt; Node_B (Stream Processor)
  Node_B -&gt; Node_C (Redis Shard 02)
  Node_C -&gt; Node_D (Postgres Replica)
  Node_D --[<span class="str">ALERT: async feedback edge</span>]--&gt; Node_B

<span class="kw">Observation</span>: Cyclic edge detected between Node_D and Node_B.
<span class="fn">Recommendation</span>: Break the cycle using an outbox queue pattern on Node_D.`
    },
    context: {
      prompt: 'Search 1.5M token codebase for race condition in cache invalidation hook',
      rate: '110 tok/s',
      latency: '340ms',
      output: `<span class="cm"># 2M Context Needle Search Result</span>
<span class="fn">Location</span>: services/cache/invalidation.go:L342
<span class="fn">Root Cause</span>: Mutex unlocked before atomic counter decremented.

<span class="kw">Code Diff</span>:
- sync.RUnlock()
- atomic.AddInt64(&amp;c.pending, -1)
+ atomic.AddInt64(&amp;c.pending, -1)
+ sync.RUnlock()

<span class="kw">Status</span>: Target found at token depth 1,489,120 with 100% retrieval confidence.`
    },
    audio: {
      prompt: 'Analyze caller sentiment, acoustic cadence, and pitch variation across audio file',
      rate: '156 tok/s',
      latency: '160ms',
      output: `<span class="cm"># Direct Acoustic Token Analysis</span>
<span class="fn">Speaker 1 (Customer)</span>:
  - Speech Cadence: 184 words/minute (elevated rate)
  - Acoustic Stress Index: 0.68 -&gt; relaxed to 0.22 at timestamp 02:45
  - Prosody: Rising inflection on resolution acknowledgment

<span class="fn">Speaker 2 (Support Representative)</span>:
  - Speech Cadence: 130 words/minute (controlled, steady)
  - Response Latency: &lt;1.1s turn-taking gap`
    }
  };

  // Console element bindings
  const promptInput = document.getElementById('console-prompt-input');
  const runBtn = document.getElementById('console-run-btn');
  const outputText = document.getElementById('console-output-text');
  const outputStatus = document.getElementById('output-status');
  const telemetryRate = document.getElementById('telemetry-rate');
  const telemetryLatency = document.getElementById('telemetry-latency');
  const copyOutputBtn = document.getElementById('copy-output-btn');
  const consoleTabs = document.querySelectorAll('.console-tab');

  let currentMode = 'code';
  let isStreaming = false;

  // Stream simulation function
  function streamResponse(content, rateStr, latencyStr) {
    if (isStreaming) return;
    isStreaming = true;
    outputStatus.textContent = 'Generating stream...';
    telemetryRate.textContent = rateStr;
    telemetryLatency.textContent = latencyStr;
    runBtn.disabled = true;

    // Fast stream simulation
    outputText.innerHTML = '<code><span class="kw">...</span></code>';
    setTimeout(() => {
      outputText.innerHTML = `<code>${content}</code>`;
      outputStatus.textContent = 'Inference complete';
      runBtn.disabled = false;
      isStreaming = false;
    }, 280);
  }

  // Handle Tab Switching
  consoleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      consoleTabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      currentMode = tab.dataset.mode;
      const data = prompts[currentMode];
      if (data) {
        promptInput.value = data.prompt;
        streamResponse(data.output, data.rate, data.latency);
      }
    });
  });

  // Handle Run Query
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const data = prompts[currentMode] || prompts.code;
      streamResponse(data.output, data.rate, data.latency);
    });
  }

  // Copy console output
  if (copyOutputBtn) {
    copyOutputBtn.addEventListener('click', () => {
      const textToCopy = outputText.innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyOutputBtn.textContent;
        copyOutputBtn.textContent = 'Copied';
        setTimeout(() => {
          copyOutputBtn.textContent = originalText;
        }, 1500);
      });
    });
  }

  // 2. Context Recall Visualizer Setup
  const haystackGrid = document.getElementById('haystack-grid');
  const depthButtons = document.querySelectorAll('.depth-btn');
  const haystackAccuracy = document.getElementById('haystack-accuracy');
  const haystackNeedlePos = document.getElementById('haystack-needle-pos');
  const haystackSearchTime = document.getElementById('haystack-search-time');

  const depthData = {
    '100k': { accuracy: '100.0%', needle: '84,120', time: '0.32s', targetCell: 14 },
    '500k': { accuracy: '100.0%', needle: '412,890', time: '0.64s', targetCell: 38 },
    '1m': { accuracy: '99.9%', needle: '918,430', time: '0.92s', targetCell: 62 },
    '2m': { accuracy: '99.9%', needle: '1,842,019', time: '1.24s', targetCell: 87 }
  };

  if (haystackGrid) {
    // Generate 100 cells
    haystackGrid.innerHTML = '';
    for (let i = 0; i < 100; i++) {
      const cell = document.createElement('div');
      cell.className = 'needle-cell scanned';
      cell.setAttribute('data-index', i.toString());
      haystackGrid.appendChild(cell);
    }

    function updateHaystack(depth) {
      const config = depthData[depth] || depthData['2m'];
      haystackAccuracy.textContent = config.accuracy;
      haystackNeedlePos.textContent = config.needle;
      haystackSearchTime.textContent = config.time;

      const cells = haystackGrid.querySelectorAll('.needle-cell');
      cells.forEach((cell, idx) => {
        cell.classList.remove('retrieved');
        if (idx === config.targetCell) {
          cell.classList.add('retrieved');
        }
      });
    }

    // Default setup
    updateHaystack('2m');

    depthButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        depthButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        const depth = btn.dataset.depth;
        updateHaystack(depth);
      });
    });
  }

  // 3. Code Quickstart Language Tabs
  const codeSnippets = {
    python: `<span class="kw">from</span> google <span class="kw">import</span> genai

client = genai.Client()
response = client.models.generate_content(
    model=<span class="str">"gemini-1.5-pro"</span>,
    contents=[<span class="str">"Explain quantum decoherence in 2 sentences."</span>],
)

<span class="fn">print</span>(response.text)`,
    javascript: `<span class="kw">import</span> { GoogleGenAI } <span class="kw">from</span> <span class="str">"@google/genai"</span>;

<span class="kw">const</span> ai = <span class="kw">new</span> GoogleGenAI();
<span class="kw">const</span> response = <span class="kw">await</span> ai.models.generateContent({
  model: <span class="str">"gemini-1.5-pro"</span>,
  contents: [<span class="str">"Explain quantum decoherence in 2 sentences."</span>],
});

console.log(response.text);`,
    curl: `<span class="kw">curl</span> <span class="str">"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"</span> \\
  -H <span class="str">"x-goog-api-key: $GEMINI_API_KEY"</span> \\
  -H <span class="str">"Content-Type: application/json"</span> \\
  -d <span class="str">'{
    "contents": [{"parts": [{"text": "Explain quantum decoherence in 2 sentences."}]}]
  }'</span>`
  };

  const codeTabs = document.querySelectorAll('.code-tab');
  const codePanel = document.getElementById('code-panel');
  const copyCodeBtn = document.getElementById('copy-code-btn');

  codeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      codeTabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      const lang = tab.dataset.lang;
      if (codePanel && codeSnippets[lang]) {
        codePanel.innerHTML = `<code>${codeSnippets[lang]}</code>`;
      }
    });
  });

  if (copyCodeBtn && codePanel) {
    copyCodeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codePanel.innerText).then(() => {
        const orig = copyCodeBtn.textContent;
        copyCodeBtn.textContent = 'Copied';
        setTimeout(() => {
          copyCodeBtn.textContent = orig;
        }, 1500);
      });
    });
  }
});

