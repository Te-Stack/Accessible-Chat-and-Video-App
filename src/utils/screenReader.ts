// utils/screenReader.ts
export class ScreenReaderAnnouncer {
    private static instance: ScreenReaderAnnouncer;
    private container: HTMLDivElement | null = null;
  
    private constructor() {
      this.createContainer();
    }
  
    static getInstance(): ScreenReaderAnnouncer {
      if (!ScreenReaderAnnouncer.instance) {
        ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
      }
      return ScreenReaderAnnouncer.instance;
    }
  
    private createContainer(): void {
      if (typeof window === 'undefined') return;
  
      this.container = document.createElement('div');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      this.container.className = 'sr-only';
      this.container.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      
      document.body.appendChild(this.container);
    }
  
    announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
      if (!this.container) return;
  
      // Update aria-live attribute if needed
      if (this.container.getAttribute('aria-live') !== priority) {
        this.container.setAttribute('aria-live', priority);
      }
  
      // Clear previous message
      this.container.textContent = '';
      
      // Add new message after a brief delay to ensure screen readers pick it up
      setTimeout(() => {
        if (this.container) {
          this.container.textContent = message;
        }
      }, 10);
  
      // Clear message after it's been announced
      setTimeout(() => {
        if (this.container) {
          this.container.textContent = '';
        }
      }, 1000);
    }
  
    cleanup(): void {
      if (this.container && document.body.contains(this.container)) {
        document.body.removeChild(this.container);
        this.container = null;
      }
    }
  }
  
  // Hook for easy usage
  export const useScreenReader = () => {
    const announcer = ScreenReaderAnnouncer.getInstance();
    
    return {
      announce: (message: string, priority?: 'polite' | 'assertive') => 
        announcer.announce(message, priority)
    };
  };