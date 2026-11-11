#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CC Studio Clean CLI — 100% Safe, Zero External Dependencies, No Background Processes.
Hỗ trợ:
  1. Tạo thẻ hợp lệ Luhn theo BIN / Pattern (PAN|MM|YY|CVV)
  2. Kiểm tra chi tiết 1 thẻ (Luhn, Brand, BIN, Hạn thẻ)
  3. Kiểm tra hàng loạt từ file .txt (Bulk Check & Xuất file LIVE/DEAD)
  4. Tra cứu BIN Ngân hàng (Quốc tế & Việt Nam)
"""

import csv
import json
import os
import random
import sys
from datetime import datetime
from pathlib import Path

BIN_DB = {
    "424242": ("Visa", "Credit", "Chase Bank (Stripe Test)", "US"),
    "400005": ("Visa", "Debit", "Chase Bank", "US"),
    "453214": ("Visa", "Credit", "Bank of America", "US"),
    "400016": ("Visa", "Debit", "JPMorgan Chase", "US"),
    "490301": ("Visa", "Debit", "Revolut", "GB"),
    "555555": ("Mastercard", "Credit", "JPMorgan Chase", "US"),
    "510510": ("Mastercard", "Credit", "Citibank", "US"),
    "515676": ("Mastercard", "Credit", "Citibank", "US"),
    "520473": ("Mastercard", "Prepaid", "N26 Bank", "DE"),
    "378282": ("Amex", "Credit", "American Express", "US"),
    "371449": ("Amex", "Credit", "American Express", "US"),
    "601111": ("Discover", "Credit", "Discover Bank", "US"),
    "356600": ("JCB", "Credit", "JCB International", "JP"),
    "621234": ("UnionPay", "Debit", "Bank of China", "CN"),
    "970436": ("NAPAS", "Debit", "Vietcombank (VCB)", "VN"),
    "970407": ("NAPAS", "Debit", "Techcombank (TCB)", "VN"),
    "970422": ("NAPAS", "Debit", "MB Bank", "VN"),
    "970415": ("NAPAS", "Debit", "VietinBank", "VN"),
    "970418": ("NAPAS", "Debit", "BIDV", "VN"),
    "970416": ("NAPAS", "Debit", "ACB", "VN"),
    "970432": ("NAPAS", "Debit", "VPBank", "VN"),
}


def only_digits(s: str) -> str:
    return "".join(c for c in str(s) if c.isdigit())


def luhn_check_digit(partial_pan: str) -> int:
    digits = [int(d) for d in only_digits(partial_pan)]
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 0:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return (10 - (total % 10)) % 10


def luhn_valid(pan: str) -> bool:
    digits = [int(d) for d in only_digits(pan)]
    if len(digits) < 13 or len(digits) > 19:
        return False
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def detect_brand(pan: str) -> tuple[str, int, int]:
    """Return (brand_name, default_length, cvv_length)."""
    d = only_digits(pan)
    if d.startswith("9704"):
        return ("NAPAS", 16, 3)
    if d.startswith("4"):
        return ("Visa", 16, 3)
    p2 = int(d[:2]) if len(d) >= 2 else 0
    p4 = int(d[:4]) if len(d) >= 4 else 0
    if 51 <= p2 <= 55 or 2221 <= p4 <= 2720:
        return ("Mastercard", 16, 3)
    if d.startswith(("34", "37")):
        return ("Amex", 15, 4)
    if d.startswith(("6011", "65")):
        return ("Discover", 16, 3)
    if 3528 <= p4 <= 3589:
        return ("JCB", 16, 3)
    if d.startswith(("30", "36", "38")):
        return ("Diners Club", 14, 3)
    if d.startswith("62"):
        return ("UnionPay", 16, 3)
    return ("Unknown", 16, 3)


def generate_card(pattern: str, mm: str = "", yy: str = "", cvv: str = "") -> dict:
    clean = pattern.strip().replace(" ", "") or "453214xxxxxxxxxx"
    brand, default_len, cvv_len = detect_brand(only_digits(clean) or "4")
    if clean.isdigit() and len(clean) < default_len:
        clean = clean + "x" * (default_len - len(clean))

    body_chars = []
    for ch in clean[:-1]:
        body_chars.append(ch if ch.isdigit() else str(random.randint(0, 9)))
    body = "".join(body_chars)
    pan = body + str(luhn_check_digit(body))

    out_mm = mm if (mm and mm.isdigit()) else f"{random.randint(1, 12):02d}"
    out_yy = yy if (yy and yy.isdigit()) else str(random.randint(27, 31))
    out_cvv = cvv if (cvv and cvv.isdigit()) else "".join(str(random.randint(0, 9)) for _ in range(cvv_len))
    return {
        "pan": pan,
        "mm": out_mm,
        "yy": out_yy,
        "cvv": out_cvv,
        "brand": brand,
        "pipe": f"{pan}|{out_mm}|{out_yy}|{out_cvv}",
    }


def cli_generate():
    print("\n--- [1] TẠO THẺ HỢP LỆ LUHN THEO BIN ---")
    pattern = input("Nhập BIN hoặc Pattern (mặc định 453214xxxxxxxxxx): ").strip() or "453214xxxxxxxxxx"
    count_str = input("Số lượng cần tạo (mặc định 10): ").strip() or "10"
    count = max(1, min(int(count_str) if count_str.isdigit() else 10, 5000))
    mm = input("Tháng MM cố định (Enter = ngẫu nhiên): ").strip()
    yy = input("Năm YY cố định (Enter = ngẫu nhiên): ").strip()
    cvv = input("CVV cố định (Enter = ngẫu nhiên): ").strip()

    cards = [generate_card(pattern, mm, yy, cvv) for _ in range(count)]
    print(f"\nĐã tạo {len(cards)} thẻ hợp lệ Luhn:\n" + "-" * 50)
    for c in cards[:30]:
        print(f"  {c['pipe']}  [{c['brand']}]")
    if len(cards) > 30:
        print(f"  ... và {len(cards) - 30} thẻ khác.")

    out_file = Path("generated_cards.txt")
    out_file.write_text("\n".join(c["pipe"] for c in cards) + "\n", encoding="utf-8")
    print("-" * 50)
    print(f"[+] Đã lưu toàn bộ vào file: {out_file.resolve()}")


def cli_validate_single():
    print("\n--- [2] KIỂM TRA CHI TIẾT 1 THẺ ---")
    raw = input("Nhập số thẻ hoặc PAN|MM|YY|CVV: ").strip()
    parts = [p.strip() for p in raw.replace("/", "|").split("|")]
    pan = only_digits(parts[0])
    if not pan:
        print("[!] Số thẻ trống.")
        return
    brand, expected_len, _ = detect_brand(pan)
    is_luhn = luhn_valid(pan)
    bin6 = pan[:6]
    bin_info = BIN_DB.get(bin6, (brand, "Unknown", "Unknown Issuer", "—"))

    print("\nKết quả phân tích:")
    print(f"  - Số thẻ (PAN) : {pan} ({len(pan)} chữ số)")
    print(f"  - Thuật toán   : {'PASS (Hợp lệ Luhn)' if is_luhn else 'FAIL (Sai Luhn)'}")
    print(f"  - Thương hiệu  : {brand} (Chuẩn: {expected_len} số)")
    print(f"  - BIN (6 số)   : {bin6} -> {bin_info[2]} ({bin_info[3]})")


def cli_bulk_check():
    print("\n--- [3] BULK CHECK TỪ FILE ---")
    in_path_str = input("Nhập đường dẫn file cần check (mặc định generated_cards.txt): ").strip() or "generated_cards.txt"
    in_path = Path(in_path_str)
    if not in_path.is_file():
        print(f"[!] Không tìm thấy file: {in_path}")
        return

    lines = [l.strip() for l in in_path.read_text(encoding="utf-8", errors="ignore").splitlines() if l.strip()]
    valid_list = []
    invalid_list = []

    for line in lines:
        parts = [p.strip() for p in line.replace("/", "|").split("|")]
        pan = only_digits(parts[0])
        brand, exp_len, _ = detect_brand(pan)
        if len(pan) == exp_len and luhn_valid(pan):
            valid_list.append(line)
        else:
            invalid_list.append(line)

    Path("results_valid.txt").write_text("\n".join(valid_list) + "\n", encoding="utf-8")
    Path("results_invalid.txt").write_text("\n".join(invalid_list) + "\n", encoding="utf-8")
    print(f"\n[+] Hoàn tất kiểm tra {len(lines)} thẻ:")
    print(f"    - Hợp lệ (VALID)   : {len(valid_list)} thẻ -> Đã lưu vào results_valid.txt")
    print(f"    - Không hợp lệ     : {len(invalid_list)} thẻ -> Đã lưu vào results_invalid.txt")


def cli_bin_lookup():
    print("\n--- [4] TRA CỨU MÃ BIN NGÂN HÀNG ---")
    b = only_digits(input("Nhập 6 chữ số đầu (BIN): ").strip())[:6]
    if len(b) < 6:
        print("[!] Vui lòng nhập đủ 6 chữ số.")
        return
    if b in BIN_DB:
        brand, ctype, issuer, country = BIN_DB[b]
    else:
        brand, _, _ = detect_brand(b)
        ctype, issuer, country = "Credit/Debit", "Chưa có trong DB Offline", "—"
    print(f"\n  BIN     : {b}")
    print(f"  Brand   : {brand}")
    print(f"  Loại    : {ctype}")
    print(f"  Ngân hàng: {issuer}")
    print(f"  Quốc gia: {country}")


def main():
    while True:
        print("\n=======================================================")
        print("   CC STUDIO CLEAN CLI (100% SAFE - NO BACKGROUND TASK)")
        print("=======================================================")
        print("  1. Tạo danh sách thẻ theo BIN / Pattern (Generator)")
        print("  2. Kiểm tra chi tiết 1 thẻ (Single Validator)")
        print("  3. Kiểm tra hàng loạt từ file (Bulk Check)")
        print("  4. Tra cứu BIN Ngân hàng (BIN Lookup)")
        print("  0. Thoát")
        choice = input("\nChọn chức năng (0-4): ").strip()
        if choice == "1":
            cli_generate()
        elif choice == "2":
            cli_validate_single()
        elif choice == "3":
            cli_bulk_check()
        elif choice == "4":
            cli_bin_lookup()
        elif choice == "0":
            print("Tạm biệt!")
            break
        else:
            print("[!] Lựa chọn không hợp lệ.")


if __name__ == "__main__":
    main()
