import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Expense, ResponseExpense } from 'src/app/interfaces/Expense';
import { ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  list(
    store_id: number,
    searchTerm?: string,
    page: number = environment.current_page,
    perPage: number = environment.per_page,
  ): Observable<ResponseExpense> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (store_id) params = params.set('store_id', store_id);
    return this.http.get<ResponseExpense>(`${this.base_url}/expense/list`, { params });
  }

  add(data:Expense):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/expense/add`, data);
  }

  update(id:number, data:Expense):Observable<ResponseMessage>{
    return this.http.put<ResponseMessage>(`${this.base_url}/expense/update/${id}`, data);
  }

  delete(id:number):Observable<ResponseMessage>{
    return this.http.delete<ResponseMessage>(`${this.base_url}/expense/delete/${id}`);
  }

}
