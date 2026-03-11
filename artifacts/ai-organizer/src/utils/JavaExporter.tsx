/**
 * JavaExporter - Export functionality for Java parity
 */

import { DocumentDTO, SegmentDTO } from '../lib/api';

interface JavaExportOptions {
  includeComments?: boolean;
  includeMetadata?: boolean;
  className?: string;
  packageName?: string;
  format?: 'class' | 'interface' | 'enum';
}

interface JavaClassStructure {
  className: string;
  packageName: string;
  imports: string[];
  fields: JavaField[];
  methods: JavaMethod[];
  enums: JavaEnum[];
  comments: string[];
}

interface JavaField {
  visibility: 'public' | 'private' | 'protected';
  type: string;
  name: string;
  value?: string;
  comment?: string;
}

interface JavaMethod {
  visibility: 'public' | 'private' | 'protected';
  returnType: string;
  name: string;
  parameters: JavaParameter[];
  body: string;
  comment?: string;
}

interface JavaParameter {
  type: string;
  name: string;
  comment?: string;
}

interface JavaEnum {
  visibility: 'public' | 'private' | 'protected';
  name: string;
  values: string[];
  comment?: string;
}

export class JavaExporter {
  private options: Required<JavaExportOptions>;

  constructor(options: JavaExportOptions = {}) {
    this.options = {
      includeComments: true,
      includeMetadata: true,
      className: 'DocumentData',
      packageName: 'com.aiorganizer.export',
      format: 'class',
      ...options,
    };
  }

  /**
   * Export document and segments to Java code
   */
  exportToJava(document: DocumentDTO, segments: SegmentDTO[]): string {
    const structure = this.buildJavaStructure(document, segments);
    return this.generateJavaCode(structure);
  }

  /**
   * Build Java class structure from document data
   */
  private buildJavaStructure(document: DocumentDTO, segments: SegmentDTO[]): JavaClassStructure {
    const className = this.options.className;
    const packageName = this.options.packageName;

    // Generate imports
    const imports = [
      'java.util.List',
      'java.util.ArrayList',
      'java.util.Date',
      'java.time.LocalDateTime',
      'java.time.format.DateTimeFormatter',
    ];

    // Generate fields
    const fields: JavaField[] = [];

    if (this.options.includeMetadata) {
      fields.push(
        {
          visibility: 'private',
          type: 'Long',
          name: 'id',
          comment: 'Document ID',
        },
        {
          visibility: 'private',
          type: 'String',
          name: 'title',
          comment: 'Document title',
        },
        {
          visibility: 'private',
          type: 'String',
          name: 'filename',
          comment: 'Original filename',
        },
        {
          visibility: 'private',
          type: 'LocalDateTime',
          name: 'createdAt',
          comment: 'Creation timestamp',
        },
        {
          visibility: 'private',
          type: 'LocalDateTime',
          name: 'updatedAt',
          comment: 'Last update timestamp',
        }
      );
    }

    fields.push(
      {
        visibility: 'private',
        type: 'List<Segment>',
        name: 'segments',
        comment: 'List of document segments',
      }
    );

    // Generate methods
    const methods: JavaMethod[] = [];

    // Constructor
    methods.push({
      visibility: 'public',
      returnType: '',
      name: className,
      parameters: [],
      body: this.generateConstructorBody(),
      comment: `Default constructor for ${className}`,
    });

    // Getters and setters
    if (this.options.includeMetadata) {
      const metadataFields = ['id', 'title', 'filename', 'createdAt', 'updatedAt'];
      metadataFields.forEach(field => {
        methods.push(this.generateGetter(field));
        methods.push(this.generateSetter(field));
      });
    }

    methods.push({
      visibility: 'public',
      returnType: 'void',
      name: 'addSegment',
      parameters: [
        { type: 'Segment', name: 'segment', comment: 'Segment to add' }
      ],
      body: 'this.segments.add(segment);',
      comment: 'Add a segment to the document',
    });

    methods.push({
      visibility: 'public',
      returnType: 'void',
      name: 'removeSegment',
      parameters: [
        { type: 'int', name: 'index', comment: 'Index of segment to remove' }
      ],
      body: 'if (index >= 0 && index < segments.size()) { segments.remove(index); }',
      comment: 'Remove a segment by index',
    });

    methods.push({
      visibility: 'public',
      returnType: 'Segment',
      name: 'getSegment',
      parameters: [
        { type: 'int', name: 'index', comment: 'Index of segment to retrieve' }
      ],
      body: 'return index >= 0 && index < segments.size() ? segments.get(index) : null;',
      comment: 'Get a segment by index',
    });

    methods.push({
      visibility: 'public',
      returnType: 'int',
      name: 'getSegmentCount',
      parameters: [],
      body: 'return segments.size();',
      comment: 'Get total number of segments',
    });

    // Utility methods
    methods.push({
      visibility: 'public',
      returnType: 'String',
      name: 'toJson',
      parameters: [],
      body: this.generateToJsonMethod(),
      comment: 'Convert document to JSON string',
    });

    methods.push({
      visibility: 'public',
      returnType: 'String',
      name: 'toString',
      parameters: [],
      body: `return "${className}{" + 
        "id=" + id + ", " +
        "title='" + (document.title || '') + "', " +
        "segments=" + segments.size() + " " +
        "}";`,
      comment: 'String representation of the document',
    });

    // Generate enums for segment types
    const enums: JavaEnum[] = [];
    const segmentTypes = [...new Set(segments.map(s => s.mode || 'unknown'))];
    
    if (segmentTypes.length > 0) {
      enums.push({
        visibility: 'public',
        name: 'SegmentType',
        values: segmentTypes.map(type => type.toUpperCase()),
        comment: 'Enumeration of segment types',
      });
    }

    // Generate comments
    const comments: string[] = [];
    if (this.options.includeComments) {
      comments.push(
        `/**`,
        ` * ${document.title || 'Untitled Document'}`,
        ` * `,
        ` * This class represents a document with its segments exported from Think!Hub.`,
        ` * Generated on: ${new Date().toISOString()}`,
        ` * `,
        ` * @author Think!Hub Exporter`,
        ` * @version 1.0`,
        ` */`
      );
    }

    return {
      className,
      packageName,
      imports,
      fields,
      methods,
      enums,
      comments,
    };
  }

  /**
   * Generate Java code from structure
   */
  private generateJavaCode(structure: JavaClassStructure): string {
    const { className, packageName, imports, fields, methods, enums, comments } = structure;

    let code = '';

    // Package declaration
    code += `package ${packageName};\n\n`;

    // Imports
    imports.forEach(imp => {
      code += `import ${imp};\n`;
    });
    code += '\n';

    // Class comments
    comments.forEach(comment => {
      code += `${comment}\n`;
    });

    // Class declaration
    code += `public class ${className} {\n\n`;

    // Fields
    fields.forEach(field => {
      if (field.comment) {
        code += `    /**\n     * ${field.comment}\n     */\n`;
      }
      code += `    ${field.visibility} ${field.type} ${field.name}`;
      if (field.value) {
        code += ` = ${field.value}`;
      }
      code += ';\n\n';
    });

    // Methods
    methods.forEach(method => {
      if (method.comment) {
        code += `    /**\n     * ${method.comment}\n     */\n`;
      }
      code += `    ${method.visibility} ${method.returnType} ${method.name}(`;
      code += method.parameters.map(p => `${p.type} ${p.name}`).join(', ');
      code += `) {\n`;
      code += `        ${method.body}\n`;
      code += '    }\n\n';
    });

    // Enums
    enums.forEach(enum_ => {
      if (enum_.comment) {
        code += `    /**\n     * ${enum_.comment}\n     */\n`;
      }
      code += `    ${enum_.visibility} enum ${enum_.name} {\n`;
      enum_.values.forEach((value, index) => {
        code += `        ${value}${index < enum_.values.length - 1 ? ',' : ''}\n`;
      });
      code += '    }\n\n';
    });

    // Close class
    code += '}\n';

    return code;
  }

  /**
   * Generate constructor body
   */
  private generateConstructorBody(): string {
    return `        this.segments = new ArrayList<>();`;
  }

  /**
   * Generate getter method
   */
  private generateGetter(field: string): JavaMethod {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    const fieldType = this.getFieldType(field);

    return {
      visibility: 'public',
      returnType: fieldType,
      name: `get${fieldName}`,
      parameters: [],
      body: `return this.${field};`,
      comment: `Get the ${field} field`,
    };
  }

  /**
   * Generate setter method
   */
  private generateSetter(field: string): JavaMethod {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    const fieldType = this.getFieldType(field);

    return {
      visibility: 'public',
      returnType: 'void',
      name: `set${fieldName}`,
      parameters: [{ type: fieldType, name: field }],
      body: `this.${field} = ${field};`,
      comment: `Set the ${field} field`,
    };
  }

  /**
   * Get field type for getter/setter
   */
  private getFieldType(field: string): string {
    switch (field) {
      case 'id': return 'Long';
      case 'createdAt':
      case 'updatedAt':
        return 'LocalDateTime';
      default:
        return 'String';
    }
  }

  /**
   * Generate JSON serialization method
   */
  private generateToJsonMethod(): string {
    return `try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(this);
        } catch (Exception e) {
            return "{\\"error\\": \\"Failed to serialize to JSON\\"}";
        }`;
  }

  /**
   * Generate Segment inner class
   */
  private generateSegmentClass(): string {
    return `
    public static class Segment {
        private Long id;
        private String title;
        private String content;
        private String mode;
        private int orderIndex;
        private boolean isManual;
        private String segmentType;
        private String evidenceGrade;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Segment() {}

        // Getters and setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
        
        public int getOrderIndex() { return orderIndex; }
        public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
        
        public boolean isManual() { return isManual; }
        public void setManual(boolean manual) { this.isManual = manual; }
        
        public String getSegmentType() { return segmentType; }
        public void setSegmentType(String segmentType) { this.segmentType = segmentType; }
        
        public String getEvidenceGrade() { return evidenceGrade; }
        public void setEvidenceGrade(String evidenceGrade) { this.evidenceGrade = evidenceGrade; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }`;
  }
}

export default JavaExporter;
