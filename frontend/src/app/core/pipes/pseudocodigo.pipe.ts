import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pseudocodigo' })
export class PseudocodigoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return (value ?? '').replace(/\\n/g, '\n');
  }
}
