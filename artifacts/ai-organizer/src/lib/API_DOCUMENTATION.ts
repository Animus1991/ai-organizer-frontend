/**
 * API Documentation
 * 
 * ## Authentication
 * 
 * All API requests (except login/register) require authentication via JWT token.
 * Token is automatically managed by the AuthProvider.
 * 
 * ### Endpoints
 * 
 * #### POST /auth/login
 * Authenticate user and receive tokens.
 * ```
 * Request: { email: string, password: string }
 * Response: { access_token: string, refresh_token: string }
 * ```
 * 
 * #### POST /auth/register
 * Register new user.
 * ```
 * Request: { email: string, password: string }
 * Response: { message: string }
 * ```
 * 
 * #### POST /auth/refresh
 * Refresh access token.
 * ```
 * Request: { refresh_token: string }
 * Response: { access_token: string }
 * ```
 * 
 * ## Documents
 * 
 * #### GET /documents
 * List all documents for authenticated user.
 * ```
 * Response: DocumentDTO[]
 * ```
 * 
 * #### GET /documents/:id
 * Get specific document details.
 * ```
 * Response: DocumentDTO
 * ```
 * 
 * #### POST /documents
 * Create new document.
 * ```
 * Request: { title?: string, text?: string, file?: File }
 * Response: DocumentDTO
 * ```
 * 
 * #### PATCH /documents/:id
 * Update document.
 * ```
 * Request: { title?: string, text?: string }
 * Response: DocumentDTO
 * ```
 * 
 * #### DELETE /documents/:id
 * Soft delete document (moves to recycle bin).
 * ```
 * Response: { ok: boolean, deletedAt: string }
 * ```
 * 
 * ## Segments
 * 
 * #### GET /documents/:id/segments
 * List segments for a document.
 * ```
 * Query: ?mode=qa|paragraphs
 * Response: SegmentDTO[]
 * ```
 * 
 * #### GET /segments/:id
 * Get specific segment.
 * ```
 * Response: SegmentDTO
 * ```
 * 
 * #### POST /documents/:id/segments
 * Create manual segment.
 * ```
 * Request: { title: string, content: string, start: number, end: number }
 * Response: SegmentDTO
 * ```
 * 
 * #### PATCH /segments/:id
 * Update segment.
 * ```
 * Request: Partial<SegmentDTO>
 * Response: SegmentDTO
 * ```
 * 
 * #### DELETE /segments/:id
 * Delete segment.
 * ```
 * Response: { ok: boolean }
 * ```
 * 
 * #### POST /documents/:id/segment
 * Auto-segment document.
 * ```
 * Request: { mode: SegmentationMode, keywords?: string[] }
 * Response: { task_id: string }
 * ```
 * 
 * ## Segmentation Modes
 * 
 * - `qa` - Question/Answer pairs
 * - `paragraphs` - Paragraph-based
 * - `keywords` - Keyword extraction
 * - `sections` - Section detection
 * - `semantic` - Semantic similarity
 * - `topics` - Topic modeling
 * - `hierarchical` - Hierarchical structure
 * - `entities` - Named entity recognition
 * - `questions` - Question detection
 * - `arguments` - Argument extraction
 * - `concepts` - Concept extraction
 * - `hybrid` - Combined approach
 * - `temporal` - Time-based
 * - `sentiment` - Sentiment analysis
 * - `dialogue` - Dialogue extraction
 * - `texttiling` - Text tiling algorithm
 * - `c99` - C99 algorithm
 * - `changepoint` - Change point detection
 * - `graph` - Graph-based
 * - `layout` - Layout analysis
 * 
 * ## Search
 * 
 * #### GET /search
 * Semantic search across documents.
 * ```
 * Query: ?q=query&document_id=123&mode=semantic
 * Response: SearchResultDTO[]
 * ```
 * 
 * ## Research
 * 
 * #### GET /research/openalex
 * Search OpenAlex database.
 * ```
 * Query: ?query=machine+learning&limit=10
 * Response: OpenAlexResult[]
 * ```
 * 
 * #### GET /research/mendeley
 * Search Mendeley (requires OAuth).
 * ```
 * Query: ?query=ai&limit=10
 * Response: MendeleyResult[]
 * ```
 * 
 * #### GET /research/prisma/:documentId
 * Get PRISMA state.
 * ```
 * Response: PrismaStateDTO
 * ```
 * 
 * #### PUT /research/prisma/:documentId
 * Save PRISMA state.
 * ```
 * Request: PrismaStateDTO
 * Response: { ok: boolean }
 * ```
 * 
 * ## Favorites
 * 
 * #### GET /favorites
 * List user's favorites.
 * ```
 * Response: FavoriteDTO[]
 * ```
 * 
 * #### POST /favorites
 * Add to favorites.
 * ```
 * Request: { document_id?: number, segment_id?: number }
 * Response: FavoriteDTO
 * ```
 * 
 * #### DELETE /favorites/:id
 * Remove from favorites.
 * ```
 * Response: { ok: boolean }
 * ```
 * 
 * ## Smart Notes
 * 
 * #### GET /workspace/documents/:id/smart-notes
 * List smart notes.
 * ```
 * Response: SmartNoteDTO[]
 * ```
 * 
 * #### POST /workspace/smart-notes
 * Create smart note.
 * ```
 * Request: { document_id: number, html: string, text: string }
 * Response: SmartNoteDTO
 * ```
 * 
 * #### PUT /workspace/smart-notes/:id
 * Update smart note.
 * ```
 * Request: { html: string, text: string }
 * Response: SmartNoteDTO
 * ```
 * 
 * ## Export
 * 
 * #### POST /export/:documentId/:format
 * Export document.
 * ```
 * Params: format = json|csv|markdown|java
 * Response: Blob
 * ```
 * 
 * ## Graph
 * 
 * #### GET /documents/:id/graph
 * Get document graph data.
 * ```
 * Response: GraphDataDTO
 * ```
 * 
 * ## Error Handling
 * 
 * All errors follow standard HTTP status codes:
 * - 400 - Bad Request
 * - 401 - Unauthorized
 * - 403 - Forbidden
 * - 404 - Not Found
 * - 422 - Validation Error
 * - 500 - Server Error
 * 
 * Error Response Format:
 * ```
 * {
 *   detail: string | Array<{ loc: string[], msg: string, type: string }>
 * }
 * ```
 * 
 * ## Rate Limiting
 * 
 * API requests are rate-limited:
 * - 100 requests per minute for authenticated users
 * - 20 requests per minute for unauthenticated users
 * 
 * Rate limit headers:
 * - X-RateLimit-Limit
 * - X-RateLimit-Remaining
 * - X-RateLimit-Reset
 */

export {};
