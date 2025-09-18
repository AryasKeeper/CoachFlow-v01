import React from 'react'

/**
 * Simple markdown parser for chat messages
 * Handles basic formatting without external dependencies
 */
export function parseMarkdown(text: string): React.ReactNode {
  // Split text into lines for processing
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null
  let inCodeBlock = false
  let codeContent: string[] = []

  const processInlineFormatting = (line: string): React.ReactNode => {
    // Handle inline code first
    const parts = line.split(/(`[^`]+`)/g)

    return parts.map((part, partIndex) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        // Inline code
        return (
          <code key={partIndex} className="px-1 py-0.5 bg-muted rounded text-sm font-mono">
            {part.slice(1, -1)}
          </code>
        )
      }

      // Handle bold and italic
      let processed = part
      const segments: React.ReactNode[] = []
      let lastIndex = 0

      // Combined regex for bold and italic
      const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
      let match

      while ((match = regex.exec(part)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
          segments.push(part.slice(lastIndex, match.index))
        }

        const matchText = match[0]
        if (matchText.startsWith('**') && matchText.endsWith('**')) {
          // Bold text
          segments.push(
            <strong key={`bold-${match.index}`}>
              {matchText.slice(2, -2)}
            </strong>
          )
        } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
          // Italic text
          segments.push(
            <em key={`italic-${match.index}`}>
              {matchText.slice(1, -1)}
            </em>
          )
        }

        lastIndex = regex.lastIndex
      }

      // Add remaining text
      if (lastIndex < part.length) {
        segments.push(part.slice(lastIndex))
      }

      return segments.length > 0 ? segments : part
    }).flat()
  }

  lines.forEach((line, index) => {
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${index}`} className="p-2 bg-muted rounded text-sm overflow-x-auto">
            <code>{codeContent.join('\n')}</code>
          </pre>
        )
        codeContent = []
        inCodeBlock = false
      } else {
        // Start code block
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeContent.push(line)
      return
    }

    // Handle headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${index}`} className="font-semibold mt-2 mb-1">
          {processInlineFormatting(line.slice(4))}
        </h4>
      )
      return
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${index}`} className="font-semibold text-lg mt-2 mb-1">
          {processInlineFormatting(line.slice(3))}
        </h3>
      )
      return
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${index}`} className="font-bold text-xl mt-2 mb-1">
          {processInlineFormatting(line.slice(2))}
        </h2>
      )
      return
    }

    // Handle lists
    const unorderedMatch = line.match(/^([•\-*])\s+(.+)/)
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)/)

    if (unorderedMatch) {
      // Unordered list item
      if (listType !== 'ul') {
        // Flush current list if type changes
        if (currentList.length > 0) {
          elements.push(
            listType === 'ol' ? (
              <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 my-2">
                {currentList}
              </ol>
            ) : (
              <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
                {currentList}
              </ul>
            )
          )
          currentList = []
        }
        listType = 'ul'
      }
      currentList.push(
        <li key={`li-${index}`}>
          {processInlineFormatting(unorderedMatch[2])}
        </li>
      )
    } else if (orderedMatch) {
      // Ordered list item
      if (listType !== 'ol') {
        // Flush current list if type changes
        if (currentList.length > 0) {
          elements.push(
            listType === 'ol' ? (
              <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 my-2">
                {currentList}
              </ol>
            ) : (
              <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
                {currentList}
              </ul>
            )
          )
          currentList = []
        }
        listType = 'ol'
      }
      currentList.push(
        <li key={`li-${index}`}>
          {processInlineFormatting(orderedMatch[2])}
        </li>
      )
    } else {
      // Not a list item - flush current list if exists
      if (currentList.length > 0) {
        elements.push(
          listType === 'ol' ? (
            <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 my-2">
              {currentList}
            </ol>
          ) : (
            <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
              {currentList}
            </ul>
          )
        )
        currentList = []
        listType = null
      }

      // Handle regular paragraphs
      if (line.trim()) {
        elements.push(
          <p key={`p-${index}`} className="mb-2">
            {processInlineFormatting(line)}
          </p>
        )
      } else if (elements.length > 0 && elements[elements.length - 1] !== null) {
        // Add spacing between paragraphs
        elements.push(<span key={`br-${index}`} className="block h-2" />)
      }
    }
  })

  // Flush any remaining list
  if (currentList.length > 0) {
    elements.push(
      listType === 'ol' ? (
        <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 my-2">
          {currentList}
        </ol>
      ) : (
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
          {currentList}
        </ul>
      )
    )
  }

  return <>{elements}</>
}